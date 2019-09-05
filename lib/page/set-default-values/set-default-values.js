const jp = require('jsonpath')
const {
  getServiceSchema
} = require('../../service-data/service-data')

const setInstanceDefaults = (instance) => {
  const schema = setDefaultValues.getServiceSchema(instance._type)
  if (!schema) {
    return instance
  }

  const schemaProps = schema.properties
  Object.keys(schemaProps).forEach(property => {
    if (property === '_type' || property === '_id') {
      return
    }
    const schemaProperty = schemaProps[property]
    if (schemaProperty.const !== undefined) {
      instance[property] = schemaProperty.const
    }
    if (instance[property] === undefined) {
      if (schemaProperty.default !== undefined) {
        instance[property] = schemaProperty.default
      }
    }
  })

  return instance
}

const setDefaultValues = (pageInstance, userData, params = {}, lang) => {
  pageInstance = setInstanceDefaults(pageInstance)
  jp.apply(pageInstance, '$..[?(@._type)]', instance => setInstanceDefaults(instance))

  return pageInstance
}
setDefaultValues.getServiceSchema = getServiceSchema

module.exports = setDefaultValues
