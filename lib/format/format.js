const htmlParser = require('node-html-parser')
const {
  getInstanceLangProperty
} = require('../service-data/service-data')

const bytes = require('./formatter/bytes')

// Marked chokes on parentheses inside link parantheses delimiters
// const Markdown = require('markdown').markdown.toHTML
const MarkdownIt = require('markdown-it')()
// .use(require('markdown-it-abbr'))
// .use(require('markdown-it-deflist'))
// .use(require('markdown-it-sup'))
// .use(require('markdown-it-sub'))
const Markdown = (str) => {
  return MarkdownIt.render(str)
}
const MessageFormat = require('messageformat')

const i18nConcat = (and, comma = ', ') => {
  return (input, ...rest) => {
    if (!Array.isArray(input)) {
      return input
    }
    input = input.slice()
    const args = {
      comma,
      and
    }

    const concatArgs = rest[1] ? rest[1].split('&') : undefined
    if (concatArgs) {
      concatArgs.forEach(arg => {
        const argParts = arg.match(/(.+?)=(.+)/)
        if (argParts) {
          const argName = argParts[1]
          const argValue = argParts[2].replace(/^"/, '').replace(/"$/, '')
          args[argName] = argValue
        } else {
          args[arg] = true
        }
      })
      if (args.reverse) {
        input = input.reverse()
      }
    }
    let output = ''
    input.forEach((inp, index) => {
      output += `${(index ? index === input.length - 1 ? args.and : args.comma : '')}${inp}`
    })
    return output
  }
}

const msgFormats = {}

msgFormats['en'] = new MessageFormat('en-GB')
msgFormats['en'].addFormatters({
  concat: i18nConcat(' and '),
  orconcat: i18nConcat(' or '),
  bytes
})

msgFormats['cy'] = new MessageFormat('cy')
msgFormats['cy'].addFormatters({
  concat: i18nConcat(' ac '),
  orconcat: i18nConcat(' neu '),
  bytes
})

const defaultLocale = 'en'

// // TODO - initialise this after data is loaded
// const defaultLocale = getInstanceProperty('service', 'languageDefault') || 'en'
// const languages = getInstanceProperty('service', 'languages') || [defaultLocale]

// const languageMap = {
//   en: 'en-GB'
// }
// // load these from metadata
// const words = {
//   and: {
//     cy: 'ac'
//   },
//   or: {
//     cy: 'neu'
//   }
// }

// languages.forEach(language => {
//   msgFormats[language] = new MessageFormat(languageMap[language] || language)
//   msgFormats[language].addFormatters({
//     concat: i18nConcat(` ${words.and[language] || 'and'} `),
//     orconcat: i18nConcat(` ${words.or[language] || 'or'} `),
//     bytes: i18nBytes
//   })
// })

const resolveNestedStrings = (value, args, options = {}) => {
  const embeddedOptions = Object.assign({}, options, {markdown: false})
  value = value.replace(/\[%.+?%\]/g, (str) => {
    str = str.replace(/^\[%\s*/, '').replace(/\s*%\]$/, '')
    let [aliasStr, ...argParts] = str.split(' ')
    let argStr = argParts.join(' ')
    let [aliasName, aliasProperty] = aliasStr.split('#')
    const result = {
      aliasName,
      aliasProperty
    }
    if (argStr) {
      result.args = htmlParser.parse(`<p ${argStr}>`).childNodes[0].attributes
      Object.keys(result.args).forEach(key => {
        const value = result.args[key]
        if (value.match(/^(true|false)$/)) {
          if (argStr.includes(`${key}=${value}`)) {
            result.args[key] = value === 'true'
          }
        } else if (value === '') {
          if (!argStr.includes(`${key}=`)) {
            result.args[key] = true
          }
        } else if (!isNaN(Number(value))) {
          if (argStr.includes(`${key}=${value}`)) {
            result.args[key] = Number(value)
          }
        }
      })
    }
    str = getInstanceLangProperty(result.aliasName, result.aliasProperty || 'value', embeddedOptions.lang)
    if (str) {
      str = format(str, Object.assign({}, args, result.args), embeddedOptions)
    }
    return str || embeddedOptions.fallback || ''
  })
  return value
}

const format = (value, args, options = {}) => {
  let formattedValue = value
  if (formattedValue === undefined || typeof formattedValue === 'number') {
    return formattedValue
  }
  const actualOptions = Object.assign({markdown: true, substitution: true, locale: defaultLocale}, options)

  const {locale, markdown, substitution} = actualOptions
  if (substitution) {
    // TODO: cache output based on knowledge of expected args?
    if (formattedValue.includes('{')) {
      try {
        const lang = options.lang || locale
        formattedValue = msgFormats[lang].compile(formattedValue)(args)
      } catch (e) {
        // allow unformatted value to be returned
      }
    }
  }
  // resolve any nested strings
  if (formattedValue.includes('[%')) {
    formattedValue = resolveNestedStrings(formattedValue, args, options)
  }
  if (markdown) {
    // TODO: cache output?
    formattedValue = Markdown(formattedValue).trim()
    // formattedValue = formattedValue.replace(/<(\/{0,1})strong>/g, '<$1b>')
    // formattedValue = formattedValue.replace(/<(\/{0,1})em>/g, '<$1i>')
    if (!actualOptions.multiline) {
      formattedValue = formattedValue.replace(/^<p>([\s\S]*)<\/p>$/, '$1')
    }
  }
  return formattedValue
}

module.exports = {
  format
}
