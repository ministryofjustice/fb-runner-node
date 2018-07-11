const jp = require('jsonpath')
const {format} = require('../../format/format')
const {default: produce} = require('immer')

const formatProperties = (pageInstance, userData) => {
  let formattedPageInstance = produce(pageInstance, draft => {
    const {getUserData} = userData
    // TODO: do this based on info from the schemas
    // we know what types are in play
    // - find the properties of those schemas that need formatting
    // - and note whether they are multiline
    const contentProps = [
      'title',
      'heading',
      'body',
      'lede',
      'legend',
      'label',
      'hint',
      'html'
    ]
    contentProps.forEach(prop => {
      jp.apply(draft, `$..${prop}`, (str) => {
        const options = {}
        if (prop === 'body') {
          options.multiline = true
        }
        if (typeof str !== 'string' && str.html) {
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
