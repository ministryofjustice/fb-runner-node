const quantifiers = {
  '+': true
}
const respect = {
  a: true,
  0: true,
  '?': true
}

const nextRegexes = {
  a: /^([a-zA-Z]+)/,
  0: /^(\d+)/,
  '?': /^(.+)/
}
const previousRegexes = {
  a: /([a-zA-Z]+)$/,
  0: /(\d+)$/
}

const getOutputChar = (char, patternChar, options = {}) => {
  if (options.protect && options.protect.includes(char)) {
    return char
  }
  if (nextRegexes[patternChar] && char.match(nextRegexes[patternChar])) {
    return char
  }
  return respect[patternChar] ? options.character : patternChar
}

const processValueWithPattern = ({value = '', pattern = '', outputfront = '', outputback = ''}, options = {}) => {
  const nextPatternChar = pattern.charAt(1)
  const lastPatternChar = pattern.charAt(pattern.length - 1)
  if (value) {
    if (!nextPatternChar || !quantifiers[nextPatternChar]) {
      const currentPatternChar = pattern.charAt(0)
      const outputChar = getOutputChar(value.charAt(0), currentPatternChar, options)
      outputfront += outputChar
      value = value.substr(1)
      pattern = pattern.substr(1)
      const processed = processValueWithPattern({value, pattern, outputfront, outputback}, options)
      value = processed.value
      pattern = processed.pattern
      outputfront = processed.outputfront
      outputback = processed.outputback
    } else if (!quantifiers[lastPatternChar]) {
      const outputChar = getOutputChar(value.charAt(value.length - 1), lastPatternChar, options)
      outputback = outputChar + outputback
      value = value.substr(0, value.length - 1)
      pattern = pattern.substr(0, pattern.length - 1)
      const processed = processValueWithPattern({value, pattern, outputfront, outputback}, options)
      value = processed.value
      pattern = processed.pattern
      outputfront = processed.outputfront
      outputback = processed.outputback
    } else if (quantifiers[nextPatternChar]) {
      const replaceChar = pattern.charAt(0)
      const nextChar = pattern.charAt(2)
      if (nextChar) {
        if (nextRegexes[replaceChar]) {
          value = value.replace(nextRegexes[replaceChar], (m, m1) => {
            outputfront += m1
            return ''
          })
          pattern = pattern.substr(2)
          const processed = processValueWithPattern({value, pattern, outputfront, outputback}, options)
          value = processed.value
          pattern = processed.pattern
          outputfront = processed.outputfront
          outputback = processed.outputback
        } else {
          const replacePrevChar = pattern.charAt(pattern.length - 2)
          if (nextRegexes[replacePrevChar]) {
            value = value.replace(previousRegexes[replacePrevChar], (m, m1) => {
              outputback = m1 + outputback
              return ''
            })
            pattern = pattern.substr(0, pattern.length - 2)
            const processed = processValueWithPattern({value, pattern, outputfront, outputback}, options)
            value = processed.value
            pattern = processed.pattern
            outputfront = processed.outputfront
            outputback = processed.outputback
          } else {
            // pattern cannot be further resolved (eg. *+0*+)
            const actualReplaceChar = options.character
            outputfront += value.replace(/./g, actualReplaceChar)
            value = ''
          }
        }
      } else {
        // final multi-char to match
        let outputChars = value
        value = ''
        if (options.minChars) {
          const padChar = respect[replaceChar] ? options.character : replaceChar
          while (outputChars.length < options.minChars) {
            outputChars += padChar
          }
        }
        if (!respect[replaceChar]) {
          const replaceRegexStr = options.protect ? `[^${options.protect.join('')}]` : '.'
          const replaceRegex = new RegExp(replaceRegexStr, 'g')
          outputChars = outputChars.replace(replaceRegex, replaceChar)
        } else {
          if (nextRegexes[replaceChar]) {
            if (!outputChars.match(nextRegexes[replaceChar])) {
              outputChars = outputChars.replace(/./g, options.character)
            }
          }
        }
        outputfront += outputChars
      }
    }
  }
  let output = ''
  if (!value) {
    output = outputfront + outputback
  }
  if (options.minChars) {
    let replaceChar = options.character
    if (pattern.length === 2 && pattern.charAt(1) === '+') {
      replaceChar = pattern.charAt(0)
    }
    while (output.length < options.minChars) {
      output += replaceChar
    }
  }
  return {
    output,
    outputfront,
    outputback,
    value,
    pattern
  }
}

const redact = (value = '', pattern, options = {}) => {
  if (pattern && pattern.match(/^'.+'$/)) {
    options.replacement = pattern.replace(/^'(.+)'$/, '$1')
  }
  if (options.replacement) {
    return options.replacement
  }
  if (!pattern) {
    return value
  }
  if (pattern.length === 1) {
    pattern += '+'
  }
  // ?+*+ => *+ , ?+0*+ => *+ , ?+#+ => #+
  pattern = pattern.replace(/\?\+.*([^a0?])\+/, '$1+')
  // set default redaction character
  options.character = options.character || '*'
  let {output} = processValueWithPattern({
    value,
    pattern
  }, options)
  if (output.length < value.length) {
    const replaceChar = options.character
    output = value.replace(/./g, replaceChar)
  }
  return output
}

module.exports = redact
