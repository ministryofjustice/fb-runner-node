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

const getErrorArgs = (controlInstance = {}, error, lang) => {
  // TODO: more robust retrieval of control
  let errorBundle = {}
  if (error) {
    errorBundle = Object.assign({}, error.values, {
      value: error.instance,
      targetValue: error.targetValue,
      errorName: error.name,
      errorMessage: error.message
    })
    if (error.name === 'type') {
      errorBundle.errorType = error.schema.type
    }
  }
  let control = controlInstance[`label:${lang}`] || controlInstance.label
  if (!control) {
    control = controlInstance[`legend:${lang}`] || controlInstance.legend
  }
  return Object.assign({
    control
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
external.getFormattedError = (position, controlInstance, errorType, error, lang) => {
  errorType = adjustErrorType(errorType, controlInstance)

  const instanceErrorStrings = getInstanceErrorStrings(controlInstance, errorType)
  const getInstanceErrorString = (position) => {
    let instanceErrorString = instanceErrorStrings[position]
    if (lang) {
      const langErrorString = instanceErrorStrings[`${position}:${lang}`]
      if (langErrorString) {
        instanceErrorString = langErrorString
      }
    }
    return instanceErrorString
  }
  // look up instance error string for specific position (summary or inline)
  let errorString = getInstanceErrorString(position)
  if (errorString === undefined) {
    // look up instance error string for any position
    errorString = getInstanceErrorString('any')
  }

  // if no error string defined on the control, lookup potential error strings
  if (errorString === undefined) {
    const errorLookups = [
      // errorType.controlType.location summary or inline
      // eg. error.required.text.inline
      `error.${errorType}.${controlInstance._type}.${position}`,
      // errorType.controlType
      // eg. error.required.text
      `error.${errorType}.${controlInstance._type}`,
      // errorType.location
      // eg. error.required.inline
      `error.${errorType}.${position}`,
      // errorType
      // eg. error.required
      `error.${errorType}`
    ]
    errorLookups.some(errorLookup => {
      errorString = external.getString(errorLookup, lang)
      return errorString
    })
    if (errorString === undefined) {
      // nothing found - use the bare errorType, but should not reach here
      errorString = errorType
    }
  }

  if (errorString) {
    const errorArgs = getErrorArgs(controlInstance, error, lang)
    errorString = format(`${errorString}`, errorArgs, {lang})
    // TODO: Move this to format
    errorString = errorString.replace(/<\/p>\s*<p>/g, '<br>').replace(/<\/*p>/g, '')
  }
  return errorString
}

external.setControlErrors = (pageInstance, errorObjs = []) => {
  return produce(pageInstance, draft => {
    errorObjs.forEach(errorObj => {
      const controlInstance = external.setControlError(pageInstance, errorObj.instance, errorObj.errorType, errorObj.error)
      jp.apply(draft, `$..[?(@._id === "${controlInstance._id}")]`, value => controlInstance)
    })
    return draft
  })
}

external.setControlError = (pageInstance, controlInstance, errorType, error) => {
  controlInstance = produce(controlInstance, draft => {
    draft.error = draft.error ? `${draft.error}<br>` : ''
    draft.error += external.getFormattedError('inline', draft, errorType, error, pageInstance.contentLang)

    return draft
  })
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
  pageInstance.errorsSeen = pageInstance.errorsSeen || {}
  if (controlInstance) {
    const {_id} = controlInstance
    const errorSeen = pageInstance.errorsSeen[_id]
    pageInstance.errorsSeen[_id] = errorType
    if (errorSeen) {
      if (errorType === 'required' || errorSeen === 'required') {
        return pageInstance
      }
    }
  }

  let pageError = external.getFormattedError('summary', controlInstance, errorType, error, pageInstance.contentLang)

  pageInstance.errorList = pageInstance.errorList || []
  // TODO: make the href id robust - eg. will fail for repeatable items on page
  let errorId = controlInstance.id || controlInstance._id || ''
  // duplicated from nunjucks-configuration
  errorId = errorId.replace(/(\[|\]|\.)/g, '_').replace(/_+/g, '_')

  let href = errorId ? `#${errorId}` : ''
  if (pageError.includes('==/')) {
    pageError = pageError.replace(/==(\/.*)$/, (m, m1) => {
      href = m1
      return ''
    })
  }
  pageInstance.errorList.push({
    html: pageError,
    href
  })

  return pageInstance
}

external.setSummaryErrorsHeading = (pageInstance) => {
  const heading = external.getString('errors.summary.heading', pageInstance.contentLang) || ''
  pageInstance.errorTitle = external.format(heading, {errorCount: pageInstance.errorList.length}, {lang: pageInstance.contentLang})
  return pageInstance
}

module.exports = external
