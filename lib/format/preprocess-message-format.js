const preprocessMessageFormat = (value) => {
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
    formatString += ` lookup="${argStr}"`
    return formatString
  })
  return value
}

module.exports = preprocessMessageFormat
