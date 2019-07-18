const jp = require('jsonpath')
const {format} = require('../../format/format')
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getUrl} = require('../../route/route')
const {
  getServiceSchema
} = require('../../service-data/service-data')

const massageParams = (str) => {
  return str.replace(/\[#(.*?)\]/g, (m, m1) => {
    return `{param@${m1}}`
  })
}

const formatInstanceContent = (instance, userData, params = {}, lang, pageInstance) => {
  const schema = formatProperties.getServiceSchema(instance._type) || formatProperties.getServiceSchema(`definition.${instance._type}`)
  if (!schema) {
    return instance
  }
  instance = deepClone(instance)

  const surplusProperties = schema.surplusProperties || []
  const schemaProps = schema.properties

  const scopeArgs = {
    param: params,
    page: pageInstance,
    instance
  }

  const data = userData.getScopedUserData(scopeArgs)

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
      // TODO: move this to a separate method and then extract to editor
      if (userData.EDITMODE === 'edit') {
        if (!instance[property] && property !== 'href') {
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
      if (instance[property] && !instance[property].includes('/')) {
        const routeUrl = getUrl(instance[property], userData.params || {}, userData.contentLang)
        if (routeUrl) {
          instance[property] = routeUrl
        }
      }
    }
  })

  return instance
}

const formatProperties = (pageInstance, userData, params = {}, lang) => {
  lang = lang || userData.contentLang

  pageInstance = formatInstanceContent(pageInstance, userData, params, lang, pageInstance)
  jp.apply(pageInstance, '$..[?(@._type)]', instance => formatInstanceContent(instance, userData, params, lang, pageInstance))

  return pageInstance
}
formatProperties.getServiceSchema = getServiceSchema

module.exports = formatProperties
