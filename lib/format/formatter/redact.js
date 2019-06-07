const redact = require('../../redact/redact')
const parseArgs = require('../parse-args')

const redactValue = (value, args = {}) => {
  args.pattern = args.pattern || '*'
  return redact(value, args.pattern, args)
}

const redactFormatter = (input, ...rest) => {
  const args = parseArgs(rest[1])
  return redactValue(input, args)
}

module.exports = {
  redact: redactValue,
  redactFormatter
}
