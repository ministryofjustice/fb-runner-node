const jp = require('jsonpath')
const {format} = require('../../format/format')
const {default: produce} = require('immer')
const {getUrl} = require('../../route/route')
const {
  getServiceSchema
} = require('../../service-data/service-data')

const massageParams = (str) => {
  return str.replace(/\[#(.*?)\]/g, (m, m1) => {
    return `{param__${m1}}`
  })
}

const formatInstanceContent = (instance, userData, params = {}, lang) => {
  const schema = formatProperties.getServiceSchema(instance._type) || formatProperties.getServiceSchema(`definition.${instance._type}`)
  if (!schema) {
    return instance
  }

  const surplusProperties = schema.surplusProperties || []
  const formattedInstance = produce(instance, draft => {
    const schemaProps = schema.properties

    const data = userData.getScopedUserData(params)

    Object.keys(schemaProps).forEach(property => {
      const schemaProperty = schemaProps[property]
      // TODO: make schemaProperty.url trigger schemaProperty.content automatically
      if (schemaProperty.content && !surplusProperties.includes(property)) {
        if (lang) {
          const langProperty = instance[`${property}:${lang}`]
          if (langProperty !== undefined) {
            instance[property] = langProperty
          }
        }
        if (userData.EDITMODE === 'edit') {
          if (!instance[property]) {
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
          const options = {
            lang: userData.contentLang
          }
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
      if (schemaProperty.url && !surplusProperties.includes(property)) {
        if (!instance[property].includes('/')) {
          const routeUrl = getUrl(instance[property], userData.params || {}, userData.contentLang)
          if (routeUrl) {
            instance[property] = routeUrl
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

const formatProperties = (pageInstance, userData, params = {}) => {
  let formattedPageInstance = produce(pageInstance, draft => {
    jp.apply(draft, '$..[?(@._type)]', instance => setInstanceDefaults(instance))
    draft = setInstanceDefaults(draft)

    const lang = userData.contentLang

    jp.apply(draft, '$..[?(@._type)]', instance => formatInstanceContent(instance, userData, params, lang))
    draft = formatInstanceContent(draft, userData, params, lang)

    return draft
  })
  return formattedPageInstance
}
formatProperties.getServiceSchema = getServiceSchema

module.exports = formatProperties
