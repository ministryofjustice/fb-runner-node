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
msgFormats['en-GB'] = new MessageFormat('en-GB')
const defaultLocale = 'en-GB'
msgFormats['en-GB'].addFormatters({
  concat: (input, ...rest) => {
    if (!Array.isArray(input)) {
      return input
    }
    input = input.slice()
    const args = {
      comma: ', ',
      and: ' and '
    }
    const concatArgs = rest[1]
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
})

const format = (value, args, options = {}) => {
  let formattedValue = value
  const actualOptions = Object.assign({markdown: true, process: true, locale: defaultLocale})
  const {locale, markdown, process} = actualOptions
  if (process) {
    if (formattedValue.includes('{')) {
      formattedValue = msgFormats[locale].compile(formattedValue)(args)
    }
  }
  if (markdown) {
    formattedValue = Markdown(formattedValue).trim()
    // formattedValue = formattedValue.replace(/<(\/{0,1})strong>/g, '<$1b>')
    formattedValue = formattedValue.replace(/<(\/{0,1})em>/g, '<$1i>')
    if (!actualOptions.multiline) {
      formattedValue = formattedValue.replace(/^<p>(.*)<\/p>$/, '$1')
    }
    // do some markdown here
  }
  return formattedValue
}

module.exports = {
  format
}
