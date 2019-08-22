const parseArgs = require('../parse-args')

const conjoin = (input, args) => {
  args = Object.assign({
    and: ' and ',
    comma: ', '
  }, args)
  if (!Array.isArray(input)) {
    return input
  }
  if (args.reverse) {
    input = input.reverse()
  }
  let output = ''
  input.forEach((inp, index) => {
    output += `${index ? index === input.length - 1 ? args.and : args.comma : ''}${inp}`
  })
  return output
}

const conjoinFormatter = (and, comma = ', ') => {
  return (input, ...rest) => {
    if (!Array.isArray(input)) {
      return input
    }
    const args = Object.assign({and, comma}, parseArgs(rest[1]))
    return conjoin(input, args)
  }
}

module.exports = {
  conjoin,
  conjoinFormatter
}
