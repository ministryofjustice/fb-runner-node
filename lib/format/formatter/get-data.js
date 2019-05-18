const parseArgs = require('../parse-args')
const get = require('lodash.get')

const getData = (input = {}, ...rest) => {
  const args = Object.assign({scope: 'input'}, parseArgs(rest[1]))
  const scopedData = input[args.scope] || {}
  return get(scopedData, args.identifier)
}

const getArgs = (identifier, scope = 'input', input = {}) => {
  const scopedData = input[scope] || {}
  return get(scopedData, identifier)
}

const placeholderLeftCurlyBrace = '§§ESCAPEDLEFTCURLYBRACE§§'
const placeholderRightCurlyBrace = '§§ESCAPEDRIGHTCURLYBRACE§§'
const escapedLeftCurlyBraceRegex = /'\{'/g
const escapedRightCurlyBraceRegex = /'\}'/g
const escapedLeftCurlyBrace = '\'{\''
const escapedRightCurlyBrace = '\'}\''
const placeholderLeftCurlyBraceRegex = new RegExp(placeholderLeftCurlyBrace, 'g')
const placeholderRightCurlyBraceRegex = new RegExp(placeholderRightCurlyBrace, 'g')

const preprocessMessageFormat = (value, args) => {
  if (value === undefined) {
    return
  }
  let unchanged = true

  // replace any escaped curly braces with placeholder values
  value = value.replace(escapedLeftCurlyBraceRegex, placeholderLeftCurlyBrace)
  value = value.replace(escapedRightCurlyBraceRegex, placeholderRightCurlyBrace)

  const updatedArgs = {}

  value = value.replace(/\{([^{},]+)/g, (m, m1) => {
    let formatArgs = {}
    let identifier = m1.trim()
    let scopeParts = identifier.split('@')
    if (scopeParts[1]) {
      formatArgs.scope = scopeParts[0]
      identifier = scopeParts[1]
    }
    if (identifier.includes('.')) {
      formatArgs.nested = true
    }
    if (identifier.includes('[')) {
      formatArgs.nested = true
    }
    if (!formatArgs.scope && !formatArgs.lang && !formatArgs.nested) {
      return m
    }
    unchanged = false

    const formatValue = getArgs(identifier, formatArgs.scope, args)

    let formatString = '__FORMATDATA'
    if (formatArgs.scope) {
      formatString += `__SCOPE_${formatArgs.scope}`
    }

    const adjustedArgString = identifier
      .replace(/\./g, '__dot__')
      .replace(/\[/g, '__leftbracket__')
      .replace(/\]/g, '__rightbracket__')
    formatString += `__IDENTIFIER_${adjustedArgString}`

    updatedArgs[formatString] = formatValue

    return `{${formatString}`
  })
  if (unchanged) {
    return
  }

  // re-escape any curly braces
  value = value.replace(placeholderLeftCurlyBraceRegex, escapedLeftCurlyBrace)
  value = value.replace(placeholderRightCurlyBraceRegex, escapedRightCurlyBrace)
  return {
    value,
    args: updatedArgs
  }
}

module.exports = {
  getData,
  preprocessMessageFormat
}
