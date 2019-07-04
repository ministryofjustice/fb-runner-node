const jp = require('jsonpath')
const {format} = require('../../format/format')
// const {default: produce} = require('immer')
const produce = (i, fn) => {
  let draft = JSON.parse(JSON.stringify(i))
  return fn(draft)
}
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

  const surplusProperties = schema.surplusProperties || []
  const formattedInstance = produce(instance, draft => {
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
          const langProperty = draft[`${property}:${lang}`]
          if (langProperty !== undefined) {
            draft[property] = langProperty
          }
        }
        // TODO: move this to a separate method and then extract to editor
        if (userData.EDITMODE === 'edit') {
          if (!draft[property]) {
            let optionalOrNot = 'Required - '
            let optionalOrNotElement = '***'
            if (!schema.required || !schema.required.includes(property)) {
              optionalOrNot = 'Optional - '
              optionalOrNotElement = '*'
            }
            draft[property] = `${optionalOrNotElement}${optionalOrNot}${schemaProperty.title}${optionalOrNotElement}`
          }
        }
        if (draft[property]) {
          const options = {
            lang: userData.contentLang
          }
          if (schemaProperty.multiline) {
            options.multiline = true
          }
          if (typeof draft[property] === 'object') {
            if (draft[property].html) {
              draft[property].html = format(massageParams(draft[property].html), data, options)
            }
          } else {
            draft[property] = format(massageParams(draft[property]), data, options)
          }
        }
      }
      if (schemaProperty.url && !surplusProperties.includes(property)) {
        if (draft[property] && !draft[property].includes('/')) {
          const routeUrl = getUrl(draft[property], userData.params || {}, userData.contentLang)
          if (routeUrl) {
            draft[property] = routeUrl
          }
        }
      }
    })
    return draft
  })
  return deepClone(formattedInstance)
}

const formatProperties = (pageInstance, userData, params = {}, lang) => {
  pageInstance = deepClone(pageInstance)
  let formattedPageInstance = produce(pageInstance, draft => {
    lang = lang || userData.contentLang

    draft = formatInstanceContent(draft, userData, params, lang, draft)
    jp.apply(draft, '$..[?(@._type)]', instance => formatInstanceContent(instance, userData, params, lang, draft))

    return draft
  })
  return formattedPageInstance
}
formatProperties.getServiceSchema = getServiceSchema

module.exports = formatProperties
