const jp = require('jsonpath')
const produce = (i, fn) => {
  let draft = JSON.parse(JSON.stringify(i))
  return fn(draft)
}
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {
  getServiceSchema
} = require('../../service-data/service-data')

const setInstanceDefaults = (instance) => {
  const schema = setDefaultValues.getServiceSchema(instance._type)
  if (!schema) {
    return instance
  }
  const defaultedInstance = produce(instance, draft => {
    const schemaProps = schema.properties
    Object.keys(schemaProps).forEach(property => {
      if (draft[property] === undefined) {
        const schemaProperty = schemaProps[property]
        if (schemaProperty.default !== undefined) {
          draft[property] = schemaProperty.default
        }
      }
    })
    return draft
  })
  return defaultedInstance
}

const setDefaultValues = (pageInstance, userData, params = {}, lang) => {
  pageInstance = deepClone(pageInstance)
  let instanceDefaultsPageInstance = produce(pageInstance, draft => {
    draft = setInstanceDefaults(draft)
    jp.apply(draft, '$..[?(@._type)]', instance => setInstanceDefaults(instance))

    return draft
  })
  return instanceDefaultsPageInstance
}
setDefaultValues.getServiceSchema = getServiceSchema

module.exports = setDefaultValues
