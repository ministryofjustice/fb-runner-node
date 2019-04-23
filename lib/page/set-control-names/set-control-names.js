/**
 * @module setControlNames
 **/

const jp = require('jsonpath')
const {default: produce} = require('immer')

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
  const updatedInstance = produce(instance, draft => {
    if (parentInstance) {
      let namePrefix = parentInstance.namePrefix
      if (draft.namespaceProtect) {
        namePrefix = undefined
      }

      if (instance.namespace) {
        namePrefix = namePrefix ? `${namePrefix}.` : ''
        namePrefix += draft.namespace
      }
      if (namePrefix) {
        draft.namePrefix = namePrefix
        if (instance.name) {
          draft.name = `${namePrefix}.${draft.name}`
        }
      }
    }

    const typeSchema = schemas[draft._type]
    const typeInstructions = typeSchema ? jp.value(typeSchema, '$.transforms.namespace.propagation') : undefined
    if (typeInstructions) {
      jp.apply(draft, `$.${typeInstructions}`, (subInstance) => propagateInstance(subInstance, draft))
    }
    draft.$namespaceUpdated = true
    return draft
  })
  return updatedInstance
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
