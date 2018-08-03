const jp = require('jsonpath')
const {default: produce} = require('immer')

const {format} = require('../../format/format')
const {getInstance, getInstanceProperty, getString} = require('../../service-data/service-data')

const external = {
  format,
  getInstance,
  getString,
  getInstanceProperty
}

external.initAddError = (errors) => function addError (errorType, instance, error) {
  errors.push({
    instance,
    errorType,
    error
  })
}

external.adjustErrorObjs = (pageInstance, errorObjs) => {
  if (!errorObjs) {
    return
  }
  if (typeof errorObjs === 'string') {
    return errorObjs
  }
  return errorObjs.map(errorObj => {
    if (typeof errorObj.instance === 'string') {
      const controlInstance = jp.query(pageInstance, `$..[?(@.name === "${errorObj.instance}")]`)[0]
      errorObj.instance = controlInstance
    }
    if (!errorObj.instance) {
      errorObj.instance = {}
    }
    return errorObj
  })
}

external.setErrors = (pageInstance, errorObjs) => {
  const adjustedErrorObjs = external.adjustErrorObjs(pageInstance, errorObjs)

  const erroredPageInstance = produce(pageInstance, draft => {
    external.setControlErrors(draft, adjustedErrorObjs)
    external.setSummaryErrors(draft, adjustedErrorObjs)
    return draft
  })
  return erroredPageInstance
}

const adjustErrorType = (errorType, controlInstance) => {
  if (controlInstance.validation) {
    if (errorType === 'minimum' && controlInstance.validation.exclusiveMinimum) {
      errorType = 'exclusiveMinimum'
    } else if (errorType === 'maximum' && controlInstance.validation.exclusiveMaximum) {
      errorType = 'exclusiveMaximum'
    }
  }
  return errorType
}

const getErrorArgs = (controlInstance = {}, error) => {
  // TODO: more robust retrieval of control
  let errorBundle = {}
  if (error) {
    errorBundle = {
      value: error.instance,
      errorName: error.name,
      errorMessage: error.message
    }
    if (error.name === 'type') {
      errorBundle.errorType = error.schema.type
    }
  }
  return Object.assign({
    control: controlInstance.label || controlInstance.legend
  },
  controlInstance.validation,
  errorBundle)
}

const getInstanceErrorStrings = (controlInstance = {}, errorType) => {
  return controlInstance.errors && controlInstance.errors[errorType] ? controlInstance.errors[errorType] : {}
}

/*
* @private
*/
external.getFormattedError = (location, controlInstance, errorType, error) => {
  errorType = adjustErrorType(errorType, controlInstance)

  const instanceErrorStrings = getInstanceErrorStrings(controlInstance, errorType)
  let errorString = instanceErrorStrings[location]

  // TODO: handle composite errors
  if (errorString === undefined) {
    errorString = external.getString(`error.${errorType}.${controlInstance._type}.${location}`)
    if (errorString === undefined) {
      errorString = external.getString(`error.${errorType}.${location}`)
      if (errorString === undefined) {
        errorString = errorType
      }
    }
  }

  if (errorString) {
    const errorArgs = getErrorArgs(controlInstance, error)
    errorString = format(`${errorString}`, errorArgs)
    // TODO: Move this to format
    errorString = errorString.replace(/<\/p>\s*<p>/g, '<br>').replace(/<\/*p>/g, '')
  }

  return errorString
}

external.setControlErrors = (pageInstance, errorObjs = []) => {
  errorObjs.forEach(errorObj => {
    external.setControlError(pageInstance, errorObj.instance, errorObj.errorType, errorObj.error)
  })
}

external.setControlError = (pageInstance, controlInstance, errorType, error) => {
  controlInstance.error = controlInstance.error ? `${controlInstance.error}<br>` : ''
  controlInstance.error += external.getFormattedError('inline', controlInstance, errorType, error)

  return controlInstance
}

external.setSummaryErrors = (pageInstance, errorObjs = []) => {
  errorObjs.forEach(errorObj => {
    external.setSummaryError(pageInstance, errorObj.instance, errorObj.errorType, errorObj.error)
  })
  if (errorObjs.length) {
    external.setSummaryErrorsHeading(pageInstance)
  }
}

external.setSummaryError = (pageInstance, controlInstance, errorType, error) => {
  let pageError = external.getFormattedError('summary', controlInstance, errorType, error)

  pageInstance.errorList = pageInstance.errorList || []
  // TODO: make the href id robust - eg. will fail for repeatable items on page
  pageInstance.errorList.push({
    html: pageError,
    href: `#${controlInstance.id || controlInstance._id}`
  })

  return pageInstance
}

external.setSummaryErrorsHeading = (pageInstance) => {
  const heading = external.getString('errors.summary.heading') || ''
  pageInstance.errorTitle = external.format(heading, {errorCount: pageInstance.errorList.length})
  return pageInstance
}

module.exports = external
