const {format} = require('../../format/format')

const registerError = (siteData, page, instance, errorType, error) => {
  if (error) {
    if (errorType === 'minimum' && error.schema.exclusiveMinimum) {
      errorType = 'exclusiveMinimum'
    } else if (errorType === 'maximum' && error.schema.exclusiveMaximum) {
      errorType = 'exclusiveMaximum'
    }
  }

  // Grab the error strings
  const errorStrings = siteData.errorStrings
  const errorHeaderStrings = siteData.errorHeaderStrings

  const instanceErrorStrings = instance.errors[errorType] || {}
  let {inline, summary} = instanceErrorStrings
  // TODO: handle composite errors
  // TODO: implement page header errors
  const args = Object.assign({control: instance.label || instance.legend}, instance.validation)
  let pageError = summary || errorHeaderStrings[`${errorType}.${instance._type}`] || errorHeaderStrings[errorType] || errorType
  pageError = format(pageError, args)
  page.errorList = page.errorList || []
  // TODO: make the href id robust - will fail for repeatable items on page
  page.errorList.push({
    html: pageError,
    href: `#${instance.id || instance._id}`
  })

  let instanceError = inline || errorStrings[`${errorType}.${instance._type}`] || errorStrings[errorType] || errorType
  instanceError = format(`${instanceError}`, args)
  instance.error = instanceError

  return true
}

module.exports = registerError
