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
msgFormats['en-GB'] = new MessageFormat('en-GB')
const defaultLocale = 'en-GB'
msgFormats['en-GB'].addFormatters({
  concat: i18nConcat(' and '),
  orconcat: i18nConcat(' or ')
})

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
        formattedValue = msgFormats[locale].compile(formattedValue)(args)
      } catch (e) {
        // allow unformatted value to be returned
      }
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
