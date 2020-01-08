require('@ministryofjustice/module-alias/register-module')(module)

const cloneDeep = require('lodash.clonedeep')

const {
  getServiceSchema,
  getString,
  getInstanceLangProperty,
  isPage
} = require('~/fb-runner-node/service-data/service-data')

const {format} = require('~/fb-runner-node/format/format')

const getDelimitedString = (a, b) => {
  if (a && a.endsWith(']') && b.includes('-')) {
    // b = `['${b}']`
  }
  const delimiter = !a || a.endsWith(']') ? '' : '.'
  return `${delimiter}${b}`.replace(/\.\[/, '[')
}

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
    const schema = getServiceSchema(_type) || {}
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

  // TODO: is pageInstance repeatable?
  // TODO: does it have namespaces and repeatables in its parental chain?
  const propagateNamespaceNested = (instance, prop) => {
    let nestedInstances = instance[prop] || []
    if (!Array.isArray(nestedInstances)) {
      nestedInstances = [nestedInstances]
    }
    nestedInstances.forEach((nestedInstance, index) => {
      propagateNamespacesRepeatable(nestedInstance, instance, prop, index)
      if (nestedInstance.conditionalComponent) {
        propagateNamespacesRepeatable(nestedInstance.conditionalComponent, instance, prop, index)
      }
    })
  }
  const propagateNamespacesRepeatable = (instance, parent, prop, parentIndex) => {
    if (!checkTypePropagatable(instance._type)) {
      return
    }
    if (!parentIndex && !parent.name && parent.repeatable) {
      instance.$parentRepeatableHeading = parent.legend || parent.label
    }
    if (!parent.name && parent.repeatable && !isPage(parent)) {
      instance.$parentId = parent.$originalId || parent._id
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
    let instanceNamespace = parent.$instanceNamespace || ''
    if (instance.namespace) {
      instanceNamespace = getDelimitedString(instanceNamespace, instance.namespace)
    }

    if (parent.repeatableNamePrefix) {
      instance.repeatableNamePrefix = parent.repeatableNamePrefix
      if (instance.name) {
        instance.name = instance.name.replace(instance.namePrefix, instance.repeatableNamePrefix)
      }
    }

    instance._idsuffix = parent._idsuffix || ''
    if (parent._idsuffix) {
      instance.$originalId = instance._id
      instance._id += parent._idsuffix
    }
    instance.$instanceNamespace = instanceNamespace
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
      const controlTitle = getInstanceLangProperty(instance._id, 'label', userData.contentLang) || getInstanceLangProperty(instance._id, 'legend', userData.contentLang)
      const defaultRepeatableAdd = getString(`repeatableAdd.${instance._type}`, userData.contentLang) || getString('repeatableAdd', userData.contentLang, 'Add another one')
      const defaultRepeatableDelete = getString(`repeatableDelete.${instance._type}`, userData.contentLang) || getString('repeatableDelete', userData.contentLang, 'Remove')
      for (let count = 1; count <= instanceCount; count++) {
        const instanceCopy = cloneDeep(instance)
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
          instanceCopy.$originalId = instanceCopy._id
          instanceCopy._id += `--${count}`
          instanceCopy._idsuffix += `--${count}`
        }
        if (instanceCount && instanceCount !== 1) {
          if (instanceCopy.legend) {
            instanceCopy.legend += ` ${count}`
          } else if (instanceCopy.label) {
            instanceCopy.label += ` ${count}`
          }
          const titleProp = instanceCopy.label ? 'label' : 'legend'
          instanceCopy[titleProp] = `${controlTitle} ${count}`
          delete instanceCopy[`${titleProp}:${userData.contentLang}`]
        }
        if (instanceCopy.name) {
          instanceCopy.name += repeatableSuffix
          // instanceCopy.repeatableNamePrefix = instanceCopy.name
          // if (instanceCopy.$instanceNamespace) {
          //   instanceCopy.name = `${instanceCopy.$instanceNamespace}${getDelimitedString(instanceCopy.$instanceNamespace, instanceCopy.name)}`
          // }
        } else {
          // instanceCopy.$instanceNamespace += repeatableSuffix
        }
        instanceCopy.repeatableNamePrefix = instanceCopy.namePrefix + repeatableSuffix
        instanceCopy.repeatableDelete = instanceCopy.repeatableDelete || defaultRepeatableDelete
        instanceCopy.repeatableDelete = format(instanceCopy.repeatableDelete, {control: controlTitle, count}, {lang: userData.contentLang})
        const instanceCopyId = instanceCopy._id
        const componentGroup = {
          _type: 'group',
          noHeading: true,
          classes: 'fb-repeatable-item--block',
          components: [
            instanceCopy
          ]
        }
        if (userCount.current > userCount.minimum || editMode) {
          const deleteButton = {
            _id: `${instanceCopyId}--remove`,
            _type: 'button',
            html: instanceCopy.repeatableDelete,
            name: 'remove',
            classes: 'fb-action-secondary fb-action--delete fb-repeatable-item--delete',
            value: `${instanceLookup}=${count}`
          }
          if (editMode) {
            deleteButton.attributes = {
              'data-block-id': instance._id,
              'data-block-property': 'repeatableDelete'
            }
          }
          componentGroup.components.push(deleteButton)
        }
        components.push(componentGroup)
        instances.push(instanceCopy)
      }
      const repeatGroup = {
        _$repeatableId: instance._id,
        _type: 'group',
        classes: 'fb-repeatable-item',
        heading: instance.repeatableHeading,
        lede: instance.repeatableLede,
        show: cloneDeep(instance.show),
        components,
        $repeatableGroup: true
      }
      if (!instance.repeatableMaximum || instanceCount < instance.repeatableMaximum) {
        let addHtml = instance.repeatableAdd || defaultRepeatableAdd
        addHtml = format(addHtml, {control: controlTitle}, {lang: userData.contentLang})

        repeatGroup.add = {
          html: addHtml,
          name: 'add',
          classes: 'fb-action-secondary fb-action--add',
          value: instanceLookup
        }
      }
      if (editMode) {
        repeatGroup.repeatableMinimum = instance.repeatableMinimum === undefined ? 1 : instance.repeatableMinimum
        repeatGroup.repeatableMaximum = instance.repeatableMaximum || 'Unlimited'
      }
      parent[prop][parentIndex] = repeatGroup
    } else {
      if (instance.name && instance.$instanceNamespace) {
        // NECESSARY?
        // instance.name = `${instance.$instanceNamespace}${getDelimitedString(instance.$instanceNamespace, instance.name)}`
      }
    }
    instances.forEach(inst => {
      propagateNamespaceNested(inst, 'items')
      propagateNamespaceNested(inst, 'components')
    })
  }

  pageInstance = cloneDeep(pageInstance)
  propagateNamespaceNested(pageInstance, 'components')

  return pageInstance
}

module.exports = setRepeatable
