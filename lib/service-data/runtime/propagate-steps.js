/**
 * @module propagateSteps
 **/

const jp = require('jsonpath')
const {deepClone, FBError} = require('@ministryofjustice/fb-utils-node')

class FBPageMissingError extends FBError { }
class FBPageParentError extends FBError { }
class FBPageRepeatableNamespaceError extends FBError { }

/**
 * Add parent ref to all page instances
 *
 * @param {object} instances
 *  Object containing all instances keyed by _id
 *
 * @return {object}
 *  Updated clone of original instances
 **/
const addPageParents = instances => {
  instances = deepClone(instances)

  jp.query(instances, '$..[?(@.steps)]').forEach(instance => {
    instance.steps.forEach(step => {
      if (!instances[step]) {
        throw new FBPageMissingError(`${step} does not exist`, {
          data: {
            step,
            instances
          }
        })
      }
      if (instances[step]._parent) {
        throw new FBPageParentError(`${step} already has _parent property`, {
          data: {
            step,
            instances
          }
        })
      }
      instances[step]._parent = instance._id
    })
  })

  return instances
}

/**
 * Recursively propagate stepsHeading to instance steps
 *
 * @param {object} instances
 *  Object containing all instances keyed by _id
 *
 * @param {object} instance
 *  Instance object
 *
 * @return {undefined}
 *  Updating of instances is achieved by setting properties directly on uncloned instances
 **/
const propagateStepsHeading = (instances, instance) => {
  if (instance.steps) {
    instance.steps.forEach(step => {
      const stepInstance = instances[step]
      if (stepInstance.sectionHeading === undefined) {
        stepInstance.sectionHeading = instance.stepsHeading
      }
    })
  }
}

/**
 * Recursively propagate sectionHeading to instance steps
 *
 * @param {object} instances
 *  Object containing all instances keyed by _id
 *
 * @param {object} instance
 *  Instance object
 *
 * @return {undefined}
 *  Updating of instances is achieved by setting properties directly on uncloned instances
 **/
const propagateSectionHeading = (instances, instance) => {
  if (instance.steps) {
    instance.steps.forEach(step => {
      const stepInstance = instances[step]
      if (stepInstance.sectionHeading === undefined) {
        stepInstance.sectionHeading = instance.sectionHeading
      }
      propagateSectionHeading(instances, stepInstance)
    })
  }
}

const seenNamespaces = {}
/**
 * Recursively propagate namespace to instance steps
 *
 * @param {object} instances
 *  Object containing all instances keyed by _id
 *
 * @param {object} instance
 *  Instance object
 *
 * @return {undefined}
 *  Updating of instances is achieved by setting properties directly on uncloned instances
 **/
const propagateNamespaces = (instances, instance) => {
  if (seenNamespaces[instance._id]) {
    return
  }
  seenNamespaces[instance._id] = true
  // NB. we propagate only a parent or a mountPoint instance, not both
  if (instance.mountPoint) {
    const mountPointInstance = instances[instance.mountPoint]
    propagateNamespaces(instances, mountPointInstance)
  } else if (instance._parent) {
    propagateNamespaces(instances, instances[instance._parent])
  }
  const recursePropagation = (instance) => {
    let namePrefix = ''
    const parent = instances[instance._parent] || instances[instance.mountPoint]
    if (parent) {
      if (!instance.namespaceProtect) {
        instance.$namespaces = deepClone(parent.$namespaces)
        namePrefix = parent.namePrefix
      }
      if (parent.scope) {
        instance.scope = instance.scope || parent.scope
      }
    }
    if (instance.namespace) {
      instance.$namespaces = instance.$namespaces || []
      instance.$namespaces.push(instance.namespace)
      namePrefix = namePrefix ? `${namePrefix}.` : ''
      namePrefix += instance.namespace
      if (instance.repeatable) {
        namePrefix += `[{${instance.namespace}}]`
      }
    }
    if (namePrefix) {
      instance.namePrefix = namePrefix
    }
    if (instance.steps) {
      instance.steps.forEach(step => {
        const stepInstance = instances[step]
        recursePropagation(stepInstance)
      })
    }
  }
  recursePropagation(instance)
}

/**
 * Recursively propagate namespace to instance steps
 *
 * @param {object} instances
 *  Object containing all instances keyed by _id
 *
 * @param {object} instance
 *  Instance object
 *
 * @return {undefined}
 *  Updating of instances is achieved by setting properties directly on uncloned instances
 **/
const propagateUrls = (instances, instance) => {
  let serviceRoot = ''
  if (instance.mountPoint) {
    const mountPointInstance = instances[instance.mountPoint]
    propagateUrls(instances, mountPointInstance)
    serviceRoot = instances[instance.mountPoint].url
  }
  if (!serviceRoot.endsWith('/')) {
    serviceRoot += '/'
  }
  if (!instance.url) {
    instance.url = `${serviceRoot}${instance._id}`
    instance.$FALLBACKurl = true
  }
  if (instance.repeatable) {
    if (!instance.namespace) {
      throw new FBPageRepeatableNamespaceError(`${instance._id} is repeatable but has no namespace`, {
        data: {
          _id: instance._id,
          instances
        }
      })
    }
    const namespaceParam = `/:${instance.namespace}`
    if (!instance.url.endsWith(namespaceParam)) {
      instance.url += namespaceParam
    }
  }
  if (instance.url.startsWith('/')) {
    return
  }
  if (!instance._parent) {
    instance.url = `${serviceRoot}${instance.url}`
  } else {
    const parentInstance = instances[instance._parent]
    propagateUrls(instances, parentInstance)
    instance.url = `${parentInstance.url}/${instance.url}`.replace(/^\/\//, '/')
  }
}

/**
 * Propagate steps information through nested instances
 *
 * @param {object} instances
 *  Object of service instances keyed by id
 *
 * @return {object}
 *  Cloned object containing instances with propagated step info
 **/
const propagate = (instances) => {
  instances = deepClone(instances)
  const instancesWithParents = addPageParents(instances)

  jp.query(instancesWithParents, '$..[?(@.stepsHeading)]').forEach(instance => {
    propagateStepsHeading(instancesWithParents, instance)
  })

  jp.query(instancesWithParents, '$..[?(@.sectionHeading)]').forEach(instance => {
    propagateSectionHeading(instancesWithParents, instance)
  })

  jp.query(instancesWithParents, '$..[?(@._type && @._type.startsWith("page."))]').forEach(instance => {
    propagateNamespaces(instancesWithParents, instance)
    propagateUrls(instancesWithParents, instance)
  })

  return instancesWithParents
}

module.exports = {
  propagate
}
