const jp = require('jsonpath')
const {format} = require('../../format/format')
const {default: produce} = require('immer')

const {
  getServiceSchema
} = require('../../service-data/service-data')

const massageParams = (str) => {
  return str.replace(/\[#(.*?)\]/g, (m, m1) => {
    return `{param__${m1}}`
  })
}

const formatInstanceContent = (instance, userData, params) => {
  const schema = formatProperties.getServiceSchema(instance._type)
  if (!schema) {
    return instance
  }
  const formattedInstance = produce(instance, draft => {
    const {getUserData, getUserParams} = userData
    const schemaProps = schema.properties

    const data = Object.assign({}, getUserData())
    let userParams = Object.assign({}, getUserParams(), params)
    Object.keys(userParams).forEach(param => {
      data[`param__${param}`] = userParams[param]
    })

    Object.keys(schemaProps).forEach(property => {
      const schemaProperty = schemaProps[property]
      if (schemaProperty.content) {
        if (userData.EDITMODE === 'edit') {
          if (instance[property] === undefined) {
            let optionalOrNot = 'Required - '
            let optionalOrNotElement = '***'
            if (!schema.required || !schema.required.includes(property)) {
              optionalOrNot = 'Optional - '
              optionalOrNotElement = '*'
            }
            instance[property] = `${optionalOrNotElement}${optionalOrNot}${schemaProperty.title}${optionalOrNotElement}`
          }
        }
        if (instance[property]) {
          const options = {}
          if (schemaProperty.multiline) {
            options.multiline = true
          }
          if (typeof instance[property] === 'object') {
            if (instance[property].html) {
              instance[property].html = format(massageParams(instance[property].html), data, options)
            }
          } else {
            instance[property] = format(massageParams(instance[property]), data, options)
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

const formatProperties = (pageInstance, userData, params) => {
  let formattedPageInstance = produce(pageInstance, draft => {
    jp.apply(draft, '$..[?(@._type)]', instance => setInstanceDefaults(instance))
    draft = setInstanceDefaults(draft)

    jp.apply(draft, '$..[?(@._type)]', instance => formatInstanceContent(instance, userData, params))
    draft = formatInstanceContent(draft, userData)

    return draft
  })
  return formattedPageInstance
}
formatProperties.getServiceSchema = getServiceSchema

module.exports = formatProperties
