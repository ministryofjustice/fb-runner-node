const htmlParser = require('node-html-parser')

// As args are marked up in the style html attributes
// we piggy back on a simple html parser

const parseArgs = (argStr) => {
  if (!argStr) {
    return {}
  }
  const args = htmlParser.parse(`<p ${argStr}>`).childNodes[0].attributes
  Object.keys(args).forEach(key => {
    const value = args[key]
    if (value.match(/^(true|false)$/)) {
      if (argStr.includes(`${key}=${value}`)) {
        args[key] = value === 'true'
      }
    } else if (value === '') {
      if (!argStr.includes(`${key}=`)) {
        args[key] = true
      }
    } else if (!isNaN(Number(value))) {
      if (argStr.includes(`${key}=${value}`)) {
        args[key] = Number(value)
      }
    }
  })
  return args
}

module.exports = parseArgs
