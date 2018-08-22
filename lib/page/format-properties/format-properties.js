const jp = require('jsonpath')
const get = require('lodash.get')
const {format} = require('../../format/format')
const {default: produce} = require('immer')

const {
  getServiceSchema
} = require('../../service-data/service-data')

const formatProperties = (pageInstance, userData) => {
  let formattedPageInstance = produce(pageInstance, draft => {
    const defaultProps = ['heading', 'sendHeading', 'sendBody']
    const schema = getServiceSchema(draft._type)
    defaultProps.forEach(prop => {
      if (!draft[prop]) {
        const defaultProp = get(schema, `properties.${prop}.default`)
        if (defaultProp) {
          draft[prop] = defaultProp
        }
      }
    })
    const {getUserData} = userData
    // TODO: do this based on info from the schemas
    // we know what types are in play
    // - find the properties of those schemas that need formatting
    // - and note whether they are multiline
    const contentProps = [
      'title',
      'heading',
      'sectionHeading',
      'body',
      'sendBody',
      'lede',
      'legend',
      'label',
      'hint',
      'html'
    ]
    contentProps.forEach(prop => {
      jp.apply(draft, `$..${prop}`, (str) => {
        const options = {}
        if (prop === 'body' || prop === 'html' || prop === 'content' || prop === 'sendBody') {
          options.multiline = true
        }
        if (str !== undefined && typeof str !== 'string' && str.html) {
          return str
        }
        return format(str, getUserData(), options)
      })
    })
    return draft
  })
  return formattedPageInstance
}

module.exports = formatProperties
