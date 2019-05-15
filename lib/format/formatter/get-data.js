const parseArgs = require('../parse-args')
const get = require('lodash.get')

const getData = (input, ...rest) => {
  const args = Object.assign({scope: 'input'}, parseArgs(rest[1]))
  const scopedData = input[args.scope] || {}
  return get(scopedData, args.identifier)
}

const preprocessMessageFormat = (value) => {
  if (value === undefined) {
    return ''
  }
  // ([^'])
  value = value.replace(/\{([^},]+)/, (m, m1) => {
    let args = {}
    let argStr = m1.trim()
    let scopeParts = argStr.split('@')
    if (scopeParts[1]) {
      args.scope = scopeParts[0]
      argStr = scopeParts[1]
    }
    let langParts = argStr.split(':')
    if (langParts[1]) {
      args.lang = langParts[1]
      argStr = langParts[0]
    }
    if (argStr.includes('.')) {
      args.nested = true
    }
    if (argStr.includes('[')) {
      args.nested = true
    }
    if (!args.scope && !args.lang && !args.nested) {
      return m
    }
    let formatString = '{_scopes, getData,'
    if (args.scope) {
      formatString += ` scope="${args.scope}"`
    }
    if (args.lang) {
      formatString += ` lang="${args.lang}"`
    }
    formatString += ` identifier="${argStr}"`
    return formatString
  })
  return value
}

module.exports = {
  getData,
  preprocessMessageFormat
}
