const parseArgs = require('./parse-args')
const {
  getInstanceLangProperty
} = require('../service-data/service-data')
const {getUrl, getFullyQualifiedUrl} = require('../route/route')

const bytes = require('./formatter/bytes')
const {conjoinFormatter} = require('./formatter/conjoin')
const {dateFormatter} = require('./formatter/date')
const {
  getData,
  preprocessMessageFormat
} = require('./formatter/get-data')

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

const msgFormats = {}

msgFormats['en'] = new MessageFormat('en')
msgFormats['en'].addFormatters({
  and: conjoinFormatter(' and '),
  or: conjoinFormatter(' or '),
  bytes,
  date: dateFormatter(),
  getData
})

msgFormats['cy'] = new MessageFormat('cy')
msgFormats['cy'].addFormatters({
  and: conjoinFormatter(' ac '),
  or: conjoinFormatter(' neu '),
  bytes,
  date: dateFormatter(),
  getData
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

const allowedNestedPrefixes = ['url', 'fqdn']

const resolveNestedStrings = (value, args, options = {}) => {
  const embeddedOptions = Object.assign({}, options, {markdown: false})
  value = value.replace(/\[%.+?%\]/g, (str) => {
    str = str.replace(/^\[%\s*/, '').replace(/\s*%\]$/, '')
    let [nestedStr, ...argParts] = str.split(' ')
    let argStr = argParts.join(' ')
    let [nestedName, nestedProperty] = nestedStr.split('#')
    const [nestedNameUrlType, nestedNameUrl] = nestedName.split(':')
    if (nestedNameUrl) {
      if (!allowedNestedPrefixes.includes(nestedNameUrlType)) {
        return value
      }
      nestedName = nestedNameUrl
      nestedProperty = 'url'
    }

    let parsedArgs
    if (argStr) {
      parsedArgs = parseArgs(argStr)
    }

    if (nestedProperty === 'url') {
      str = getUrl(nestedName, parsedArgs, embeddedOptions.lang)
      if (nestedNameUrlType === 'fqdn') {
        str = getFullyQualifiedUrl(str)
      }
    } else {
      nestedProperty = nestedProperty || 'value'
      str = getInstanceLangProperty(nestedName, nestedProperty, embeddedOptions.lang)
      if (str) {
        str = format(str, Object.assign({}, args, parsedArgs), embeddedOptions)
      }
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
  let lang = options.lang || locale
  if (substitution) {
    // TODO: cache output based on knowledge of expected args?
    if (formattedValue.includes('{')) {
      // pre-process to allow scoped and nested values
      formattedValue = preprocessMessageFormat(formattedValue)
      try {
        if (!msgFormats[lang]) {
          lang = defaultLocale
        }
        formattedValue = msgFormats[lang].compile(formattedValue)(args)
      } catch (e) {
        // allow unformatted value to be returned
      }
    }
  }
  if (!formattedValue) {
    return formattedValue
  }
  // resolve any nested strings
  if (formattedValue.includes('[%')) {
    formattedValue = resolveNestedStrings(formattedValue, args, options)
    if (!formattedValue) {
      return formattedValue
    }
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
