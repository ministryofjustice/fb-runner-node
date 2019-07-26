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

const massageValueArgs = (identifier, args, updatedArgs) => {
  identifier = identifier.trim()
  const formatArgs = {}
  const scopeParts = identifier.split('@')
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
  if (!formatArgs.scope && !formatArgs.nested) {
    return
  }

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

  return {
    value: formatString,
    args: updatedArgs
  }
}

const preprocessMessageFormat = (value, args) => {
  if (value === undefined) {
    return
  }

  let updatedArgs = {}

  let bufferMode = false
  let sendToTempBuffer = false

  let fullBuffer = ''
  let tempBuffer = ''

  for (let index = 0; index < value.length; index++) {
    let sendNextToTempBuffer = false
    const currentChar = value.charAt(index)
    const prevChar = index ? value.charAt(index - 1) : ''
    const nextChar = index < value.length - 1 ? value.charAt(index + 1) : ''
    if (currentChar === '{') {
      if (!(prevChar === '\'' && nextChar === '\'')) {
        bufferMode = !bufferMode
        if (bufferMode) {
          sendNextToTempBuffer = true
        }
      }
    } else if (currentChar === '}') {
      if (!(prevChar === '\'' && nextChar === '\'')) {
        bufferMode = !bufferMode
        sendToTempBuffer = false
      }
    } else if (bufferMode && currentChar === ',') {
      sendToTempBuffer = false
    }
    if (sendToTempBuffer) {
      tempBuffer += currentChar
    } else {
      if (tempBuffer) {
        const massaged = massageValueArgs(tempBuffer, args, updatedArgs)
        if (massaged) {
          tempBuffer = massaged.value
          updatedArgs = massaged.args
        }
        fullBuffer += tempBuffer
        tempBuffer = ''
      }
      fullBuffer += currentChar
    }
    if (sendNextToTempBuffer) {
      sendToTempBuffer = true
    }
  }

  return {
    value: fullBuffer,
    args: updatedArgs
  }
}

module.exports = {
  getData,
  preprocessMessageFormat
}
