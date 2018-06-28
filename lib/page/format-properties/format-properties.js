const jp = require('jsonpath')
const {format} = require('../../format/format')

const formatProperties = (page, inputData) => {
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
    'hint'
  ]
  contentProps.forEach(prop => {
    jp.apply(page, `$..${prop}`, (str) => {
      const options = {}
      if (prop === 'body') {
        options.multiline = true
      }
      if (typeof str !== 'string' && str.html) {
        str.html = format(str.html, inputData, options)
        return str
      }
      return format(str, inputData, options)
    })
  })
  return page
}

module.exports = formatProperties
