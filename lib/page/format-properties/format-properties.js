const jp = require('jsonpath')
const {format} = require('../../format/format')
const {default: produce} = require('immer')

const {
  getServiceSchema
} = require('../../service-data/service-data')

const formatInstanceContent = (instance, userData) => {
  const schema = formatProperties.getServiceSchema(instance._type)
  if (!schema) {
    return instance
  }
  const formattedInstance = produce(instance, draft => {
    const {getUserData} = userData
    const schemaProps = schema.properties

    Object.keys(schemaProps).forEach(property => {
      const schemaProperty = schemaProps[property]
      if (schemaProperty.content) {
        if (userData.EDITMODE === 'edit') {
          if (instance[property] === undefined) {
            let optional = ''
            if (!schema.required || !schema.required.includes(property)) {
              optional = ' (optional)'
            }
            instance[property] = `*${schemaProperty.title}${optional}*`
          }
        }
        if (instance[property]) {
          const options = {}
          if (schemaProperty.multiline) {
            options.multiline = true
          }
          if (typeof instance[property] === 'object') {
            if (instance[property].html) {
              instance[property].html = format(instance[property].html, getUserData(), options)
            }
          } else {
            instance[property] = format(instance[property], getUserData(), options)
          }
        }
      }
    })
    return draft
  })
  return formattedInstance
}

const setInstanceDefaults = (instance) => {
  const schema = getServiceSchema(instance._type)
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

const formatProperties = (pageInstance, userData) => {
  let formattedPageInstance = produce(pageInstance, draft => {
    jp.apply(draft, '$..[?(@._type)]', instance => setInstanceDefaults(instance))
    draft = setInstanceDefaults(draft)

    jp.apply(draft, '$..[?(@._type)]', instance => formatInstanceContent(instance, userData))
    draft = formatInstanceContent(draft, userData)

    return draft
  })
  return formattedPageInstance
}
formatProperties.getServiceSchema = getServiceSchema

module.exports = formatProperties
