const jp = require('jsonpath')
const {default: produce} = require('immer')

const {format} = require('../../format/format')
const {getInstance, getInstanceProperty} = require('../../service-data/service-data')

const external = {
  format,
  getInstance,
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
  return Object.assign({
    control: controlInstance.label || controlInstance.legend
  },
  controlInstance.validation,
  {
    value: error ? error.instance : undefined
  })
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
  // the following could be more succinctly written as
  // errorString = errorString || locationErrorStrings[`${errorType}.${controlInstance._type}`] || locationErrorStrings[errorType] || errorType
  // but this allows test coverage to be more obvious/explicit
  if (errorString === undefined) {
    const locationErrorStrings = external.getInstance(`errors.${location}`, {})
    if (locationErrorStrings[`${errorType}.${controlInstance._type}`] !== undefined) {
      errorString = locationErrorStrings[`${errorType}.${controlInstance._type}`]
    } else if (locationErrorStrings[errorType] !== undefined) {
      errorString = locationErrorStrings[errorType]
    } else {
      errorString = errorType
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
  controlInstance.error = controlInstance.error ? `<br>${controlInstance.error}` : ''
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
  const heading = external.getInstanceProperty('errors.summary', 'heading', '')
  pageInstance.errorTitle = external.format(heading, {errorCount: pageInstance.errorList.length})
  return pageInstance
}

module.exports = external
