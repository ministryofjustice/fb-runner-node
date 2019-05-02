/**
 * @module setControlNames
 **/

const jp = require('jsonpath')

const {
  getServiceSchemas
} = require('../../service-data/service-data')

let schemas

/**
 * Propagate namespace information of a specific instance
 *
 * @param {object} instance
 *  Instance object
 *
 * @param {string} parentInstance
 *  Any instance higher in the hierachy to inherit base namePrefix from
 *
 * @return {undefined}
 *  Updating of instances is achieved by setting properties directly on uncloned instances
 **/
const propagateInstance = (instance, parentInstance) => {
  if (instance.$namespaceUpdated) {
    return instance
  }

  if (parentInstance) {
    let namePrefix = parentInstance.namePrefix
    if (instance.namespaceProtect) {
      namePrefix = undefined
    }

    if (instance.namespace) {
      namePrefix = namePrefix ? `${namePrefix}.` : ''
      namePrefix += instance.namespace
    }
    if (namePrefix) {
      instance.namePrefix = namePrefix
      if (instance.name) {
        instance.name = `${namePrefix}.${instance.name}`
      }
    }
  }

  const typeSchema = schemas[instance._type]
  const typeInstructions = typeSchema ? jp.value(typeSchema, '$.transforms.namespace.propagation') : undefined
  if (typeInstructions) {
    jp.apply(instance, `$.${typeInstructions}`, (subInstance) => propagateInstance(subInstance, instance))
  }
  instance.$namespaceUpdated = true

  return instance
}

/**
 * Propagate namespace information through nested instances
 *
 * @param {object} instance
 *  Object of service instances keyed by id
 *
 * @return {instance}
 *  Cloned instance containing updated control names
 **/
const setControlNames = (instance) => {
  schemas = getServiceSchemas()
  return propagateInstance(instance)
}
module.exports = setControlNames
