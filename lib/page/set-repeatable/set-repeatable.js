const {default: produce} = require('immer')
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const get = require('lodash.get')

const {
  getServiceSchema
} = require('../../service-data/service-data')

const setRepeatable = (pageInstance, userData, editMode) => {
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
      if (!parent.name && parent.repeatable && !parent._type.startsWith('page.')) {
        instance.$parentIndex = parentIndex
        instance.$parentCurrent = parent.$current
        instance.$parentRepeatableAdd = parent.repeatableAdd
        instance.$parentRepeatableDelete = parent.repeatableDelete
        instance.$parentRepeatableMinimum = parent.repeatableMinimum
        instance.$parentRepeatableMaximum = parent.repeatableMaximum
        instance.$parentCount = parent.$count
        instance.$parentNamePrefix = parent.namePrefix
        // if (instance.$parentCount !== undefined && instance.$parentNamePrefix !== undefined) {
        //   instance.$parentDeleteValue = `${parent.namePrefix}=${parent.$count}`
        // }
        instance.$parentIndex = parentIndex
        if (parentIndex === parent[prop].length - 1) {
          if (parent.$count === parent.$current) {
            if (!parent.repeatableMaximum || parent.$current < parent.repeatableMaximum) {
              instance.$parentAddable = true
              instance.$parentAddValue = parent.namePrefix
            }
          }
        }
        if (!parentIndex) {
          const repeatableMinimum = parent.repeatableMinimum === undefined ? 1 : parent.repeatableMinimum
          if (instance.$parentCurrent > repeatableMinimum) {
            instance.$parentDeletable = true
            instance.$parentDeleteValue = `${parent.namePrefix}=${parent.$count}`
          }
        }
      }
      let instanceModel = parent.$instanceModel || ''
      if (instance.model) {
        instanceModel = getDelimitedString(instanceModel, instance.model)
      }

      if (parent.repeatableNamePrefix) {
        instance.repeatableNamePrefix = parent.repeatableNamePrefix
        if (instance.name) {
          instance.name = instance.name.replace(instance.namePrefix, instance.repeatableNamePrefix)
        }
      }

      instance._idsuffix = parent._idsuffix || ''
      if (parent._idsuffix) {
        instance._id += parent._idsuffix
      }
      instance.$instanceModel = instanceModel
      let instances = [instance]
      if (instance.repeatable) {
        let instanceLookup = instance.namePrefix
        if (instance.name) {
          instanceLookup = instance.name
        }

        const userCount = userData.getUserCountProperty(instanceLookup) || {}
        let instanceCount = editMode ? 1 : userCount.current
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

        const components = []
        instances = []
        const schema = getServiceSchema(instance._type)
        const defaultRepeatableAdd = get(schema, 'properties.repeatableAdd.default') || 'Add another'
        const defaultRepeatableDelete = get(schema, 'properties.repeatableDelete.default') || 'Delete'
        for (let count = 1; count <= instanceCount; count++) {
          const instanceCopy = deepClone(instance)
          instanceCopy.$count = count
          instanceCopy.$current = instanceCount
          if (instanceCount > 1 && instanceCopy.name) {
            instanceCopy.validation = instanceCopy.validation || {}
            instanceCopy.validation.required = true
          }
          const repeatableSuffix = `[${count}]`
          if (instanceCopy.id) {
            instanceCopy.id += `__${count}`
          }
          if (!editMode) {
            instanceCopy._id += `--${count}`
            instanceCopy._idsuffix += `--${count}`
          }
          if (instanceCopy.legend) {
            instanceCopy.legend += ` ${count}`
          } else if (instanceCopy.label) {
            instanceCopy.label += ` ${count}`
          }
          if (instanceCopy.name) {
            instanceCopy.name += repeatableSuffix
            // instanceCopy.repeatableNamePrefix = instanceCopy.name
            // if (instanceCopy.$instanceModel) {
            //   instanceCopy.name = `${instanceCopy.$instanceModel}${getDelimitedString(instanceCopy.$instanceModel, instanceCopy.name)}`
            // }
          } else {
            // instanceCopy.$instanceModel += repeatableSuffix
          }
          instanceCopy.repeatableNamePrefix = instanceCopy.namePrefix + repeatableSuffix
          instanceCopy.repeatableAdd = instanceCopy.repeatableAdd || defaultRepeatableAdd
          instanceCopy.repeatableDelete = instanceCopy.repeatableDelete || defaultRepeatableDelete
          const instanceCopyId = instanceCopy._id
          const componentGroup = {
            _type: 'group',
            noHeading: true,
            classes: 'fb-repeatable-item--block',
            components: [
              instanceCopy
            ]
          }
          if (userCount.current > userCount.minimum) {
            componentGroup.components.push({
              _id: `${instanceCopyId}--remove`,
              _type: 'button',
              html: instanceCopy.repeatableDelete,
              name: 'remove',
              classes: 'fb-action-secondary fb-action--delete',
              value: `${instanceLookup}=${count}`
            })
          }
          // components.push(...componentGroup.components)
          components.push(componentGroup)
          instances.push(instanceCopy)
        }
        const repeatGroup = {
          _$repeatableId: instance._id,
          _type: 'group',
          classes: 'fb-repeatable-item',
          heading: instance.repeatableHeading,
          lede: instance.repeatableLede,
          show: deepClone(instance.show),
          components,
          $repeatableGroup: true
        }
        if (!instance.repeatableMaximum || instanceCount < instance.repeatableMaximum) {
          repeatGroup.add = {
            html: instance.repeatableAdd || defaultRepeatableAdd,
            name: 'add',
            classes: 'fb-action-secondary fb-action--add',
            value: instanceLookup
          }
        }
        parent[prop][parentIndex] = repeatGroup
      } else {
        if (instance.name && instance.$instanceModel) {
          // NECESSARY?
          // instance.name = `${instance.$instanceModel}${getDelimitedString(instance.$instanceModel, instance.name)}`
        }
      }
      instances.forEach(inst => {
        propagateModelNested(inst, 'items')
        propagateModelNested(inst, 'components')
      })
    }
    propagateModelNested(draft, 'components')

    return draft
  })

  return pageInstance
}

module.exports = setRepeatable
