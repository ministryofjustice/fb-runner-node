const {default: produce} = require('immer')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {
  getServiceSchema
} = require('../../service-data/service-data')

const setRepeatable = (pageInstance, userData) => {
  const propagatableCategories = ['control', 'grouping']
  const propagatableCache = {}
  const checkTypePropagatable = (_type) => {
    if (propagatableCache[_type] !== undefined) {
      return propagatableCache[_type]
    }
    const setPropagatable = (value) => {
      propagatableCache[_type] = value
      return value
    }
    if (_type === 'button') {
      return setPropagatable(false)
    }
    if (_type === 'checkbox') {
      return setPropagatable(true)
    }
    const schema = getServiceSchema(_type)
    const schemaCategory = schema.category
    if (schemaCategory) {
      for (let index = 0; index < schemaCategory.length; index++) {
        if (propagatableCategories.includes(schemaCategory[index])) {
          return setPropagatable(true)
        }
      }
    }
    return setPropagatable(false)
  }

  pageInstance = produce(pageInstance, draft => {
    const getDelimitedString = (a, b) => {
      if (a && a.endsWith(']') && b.includes('-')) {
        // b = `['${b}']`
      }
      const delimiter = !a || a.endsWith(']') ? '' : '.'
      return `${delimiter}${b}`.replace(/\.\[/, '[')
    }
    // TODO: is pageInstance repeatable?
    // TODO: does it have models and repeatables in its parental chain?
    const propagateModelNested = (instance, prop) => {
      const nestedInstances = instance[prop] || []
      nestedInstances.forEach((nestedInstance, index) => {
        propagateModelsRepeatable(nestedInstance, instance, prop, index)
      })
    }
    const propagateModelsRepeatable = (instance, parent, prop, parentIndex) => {
      if (!checkTypePropagatable(instance._type)) {
        return
      }
      if (!parentIndex && !parent.name && parent.repeatable) {
        instance.$parentRepeatableHeading = parent.legend || parent.label
      }
      let instanceModel = parent.$instanceModel || ''
      if (instance.model) {
        instanceModel = getDelimitedString(instanceModel, instance.model)
      }

      instance._idsuffix = parent._idsuffix || ''
      if (parent._idsuffix) {
        instance._id += parent._idsuffix
      }
      instance.$instanceModel = instanceModel
      let instances = [instance]
      if (instance.repeatable) {
        let instanceLookup = instanceModel
        if (instance.name) {
          instanceLookup = `${instanceModel}${getDelimitedString(instanceModel, instance.name)}`
        }
        const userCount = userData.getUserCountProperty(instanceLookup) || {}
        let instanceCount = userCount.current
        if (instanceCount === undefined) {
          instanceCount = instance.repeatableMinimum
          if (instanceCount === undefined) {
            instanceCount = 1
          }
          userCount.current = instanceCount
          userCount.minimum = instanceCount
          userCount.maximum = instance.repeatableMaximum
          userData.setUserCountProperty(instanceLookup, userCount)
        }
        // console.log({instanceLookup, instanceCount})
        const components = []
        instances = []
        const schema = getServiceSchema(instance._type)
        for (let count = 1; count <= instanceCount; count++) {
          const instanceCopy = deepClone(instance)
          instanceCopy.$count = count
          if (instanceCount > 1 && instanceCopy.name) {
            instanceCopy.validation = instanceCopy.validation || {}
            instanceCopy.validation.required = true
          }
          const repeatableSuffix = `[${count}]`
          if (instanceCopy.id) {
            instanceCopy.id += `__${count}`
          }
          // instanceCopy._id += `--${count}`
          // instanceCopy._idsuffix += `--${count}`
          if (instanceCopy.legend) {
            instanceCopy.legend += ` ${count}`
          } else if (instanceCopy.label) {
            instanceCopy.label += ` ${count}`
          }
          if (instanceCopy.name) {
            instanceCopy.name += repeatableSuffix
            if (instanceCopy.$instanceModel) {
              instanceCopy.name = `${instanceCopy.$instanceModel}${getDelimitedString(instanceCopy.$instanceModel, instanceCopy.name)}`
            }
          } else {
            instanceCopy.$instanceModel += repeatableSuffix
          }
          const instanceCopyId = instanceCopy._id
          const componentGroup = {
            _id: `${instanceCopyId}--group`,
            _type: 'group',
            classes: 'fb-repeatable-item',
            components: [
              instanceCopy
            ]
          }
          if (userCount.current > userCount.minimum) {
            componentGroup.components.push({
              _id: `${instanceCopyId}--remove`,
              _type: 'button',
              html: instance.repeatableDelete || schema.properties.repeatableDelete.default,
              name: 'remove',
              classes: 'fb-action-secondary fb-action--delete',
              value: `${instanceLookup}=${count}`
            })
          }
          components.push(componentGroup)
          instances.push(instanceCopy)
        }
        const repeatGroup = {
          _id: `${instance._id}--group`,
          _type: 'group',
          heading: instance.repeatableHeading,
          lede: instance.repeatableLede,
          components,
          $repeatableGroup: true
        }
        if (!instance.repeatableMaximum || instanceCount < instance.repeatableMaximum) {
          repeatGroup.add = {
            html: instance.repeatableAdd || schema.properties.repeatableAdd.default,
            name: 'add',
            classes: 'fb-action-secondary fb-action--add',
            value: instanceLookup
          }
        }
        parent[prop][parentIndex] = repeatGroup
      } else {
        if (instance.name && instance.$instanceModel) {
          instance.name = `${instance.$instanceModel}${getDelimitedString(instance.$instanceModel, instance.name)}`
        }
      }
      instances.forEach(inst => {
        propagateModelNested(inst, 'items')
        propagateModelNested(inst, 'components')
      })
    }
    propagateModelNested(draft, 'components')
    // console.log(JSON.stringify(draft, null, 2))
    return draft
  })

  return pageInstance
}

module.exports = setRepeatable
