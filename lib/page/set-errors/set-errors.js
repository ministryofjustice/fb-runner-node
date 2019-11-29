require('@ministryofjustice/module-alias/register-module')(module)

const jsonPath = require('jsonpath')

const {format} = require('~/fb-runner-node/format/format')
const {getInstance, getInstanceProperty, getString} = require('~/fb-runner-node/service-data/service-data')

function initAddError (errors) {
  return function addError (errorType, instance, error) {
    errors.push({
      instance,
      errorType,
      error
    })
  }
}

function adjustErrorObjs (pageInstance, errorObjs) {
  if (!errorObjs) {
    return
  }
  if (typeof errorObjs === 'string') {
    return errorObjs
  }
  return errorObjs.map(errorObj => {
    if (typeof errorObj.instance === 'string') {
      const controlInstance = jsonPath.query(pageInstance, `$..[?(@.name === "${errorObj.instance}")]`)[0]
      errorObj.instance = controlInstance
    }
    if (!errorObj.instance) {
      errorObj.instance = {}
    }
    return errorObj
  })
}

function setErrorsSeen (pageInstance) {
  if (!pageInstance.errorsSeen) {
    pageInstance.errorsSeen = {
      summary: {},
      control: {}
    }
  }
  return pageInstance
}

function setErrors (pageInstance, errorObjs) {
  const adjustedErrorObjs = adjustErrorObjs(pageInstance, errorObjs)

  pageInstance = setErrorsSeen(pageInstance)

  pageInstance = setControlErrors(pageInstance, adjustedErrorObjs)
  pageInstance = setSummaryErrors(pageInstance, adjustedErrorObjs)
  return pageInstance
}

function adjustErrorType (errorType, controlInstance) {
  if (controlInstance.validation) {
    if (errorType === 'minimum' && controlInstance.validation.exclusiveMinimum) {
      errorType = 'exclusiveMinimum'
    } else if (errorType === 'maximum' && controlInstance.validation.exclusiveMaximum) {
      errorType = 'exclusiveMaximum'
    }
  }
  return errorType
}

function getLabelForLang (controlInstance = {}, lang) {
  return lang
    ? controlInstance[`label:${lang}`] || controlInstance.label
    : controlInstance.label
}

function getLegendForLang (controlInstance = {}, lang) {
  return lang
    ? controlInstance[`legend:${lang}`] || controlInstance.legend
    : controlInstance.legend
}

function getFormatParameters ({validation, ...controlInstance} = {}, error, lang) {
  const parameters = {}
  if (error) {
    /**
     *  Read fields from the error and write them to the parameters object
     */
    Object.assign(parameters, error.values, {
      value: error.instance,
      targetValue: error.targetValue,
      errorName: error.name,
      errorMessage: error.message
    }, error.name === 'type' ? {errorType: error.schema.type} : {})
  }

  /**
   *  Identify the control either by its (localised) label or (localised) legend field
   */
  const control = getLabelForLang(controlInstance, lang) || getLegendForLang(controlInstance, lang)

  return Object.assign({control}, validation, parameters)
}

function getInstanceErrorStringsFromControl ({errors = {}} = {}, errorType) {
  const {
    [errorType]: error = {}
  } = errors

  return error
}

function hasInstanceErrorString (errorStrings = {}, position, lang) {
  /**
   *  If `lang`
   *    return "has errorStrings `position:lang` OR default `position`"?
   *  otherwise
   *    return "has errorStrings default `position`?
   */
  return lang
    /**
     *  `Reflect.has()` can be mocked!
     */
    ? Reflect.has(errorStrings, `${position}:${lang}`) || Reflect.has(errorStrings, position)
    : Reflect.has(errorStrings, position)
}

function getInstanceErrorString (errorStrings = {}, position, lang) {
  /**
   *  If `lang`
   *    return "has errorStrings `position:lang` OR default `position`"?
   *  otherwise
   *    return "has errorStrings default `position`?
   */
  return lang
    /**
     *  `Reflect.get()` can be mocked!
     */
    ? Reflect.get(errorStrings, `${position}:${lang}`) || Reflect.get(errorStrings, position)
    : Reflect.get(errorStrings, position)
}

function normaliseErrorString (errorString, controlInstance, error, lang) {
  /**
   *  `String()` is safer than `toString()` for our purposes (`null` does not have a `toString` method)
   */
  const s = String(errorString)
  const p = getFormatParameters(controlInstance, error, lang)
  /**
   *  Transform these values
   */
  return format(s, p, {lang})
    /**
     *  Remove dangerous patterns
     */
    .replace(/<\/p>\s*<p>/g, '<br>')
    .replace(/<\/*p>/g, '')
}

function getErrorLookupsArray (errorType, controlInstanceType, position) {
/**
 *  Dual lookups are present due to earlier incorrect implementation
 *  we now have to support both for backwards compatbility
 *  we can later deprecate one over the other
 */

  return [
    // errorType.controlType.location summary or inline
    // eg. error.required.text.inline
    `error.${errorType}.${controlInstanceType}.${position}`,
    `error.${controlInstanceType}.${errorType}.${position}`,
    // errorType.controlType
    // eg. error.required.text
    `error.${errorType}.${controlInstanceType}`,
    `error.${controlInstanceType}.${errorType}`,
    // errorType.location
    // eg. error.required.inline
    `error.${errorType}.${position}`,
    // errorType
    // eg. error.required
    `error.${errorType}`
  ]
}

function getFormattedError (position, controlInstance, errorType, error, lang) {
  /**
   *  Coerce `errorType` `minimum` or `maximum` to `exclusiveMinimum` or `exclusiveMaximum`
   *  according to the presence of `validation` fields
   *
   *  This is inelegant!
   */
  errorType = adjustErrorType(errorType, controlInstance)

  const instanceErrorStrings = getInstanceErrorStringsFromControl(controlInstance, errorType)

  /**
   *  Do we have an error string in the position supplied to us, whatever it is?
   */
  if (hasInstanceErrorString(instanceErrorStrings, position, lang)) {
    /**
     *  We do. Let's get it. (It could be any value, but the implementation only cares
     *  about `undefined`)
     */
    const errorString = getInstanceErrorString(instanceErrorStrings, position, lang)
    return normaliseErrorString(errorString, controlInstance, error, lang)
  } else {
    /**
     *  We don't. Do we have an error string in the default 'any' position?
     */
    if (hasInstanceErrorString(instanceErrorStrings, 'any', lang)) {
      /**
       *  Ah-hah! Let's get that
       */
      const errorString = getInstanceErrorString(instanceErrorStrings, 'any', lang)
      return normaliseErrorString(errorString, controlInstance, error, lang)
    }
  }

  /**
   *  The control instance does not have the error string so we look up the key in
   *  the schemas
   */

  let errorString

  const errorLookups = getErrorLookupsArray(errorType, controlInstance._type, position)

  /**
   *  Look up the error string and simultaneously assign it to `errorString`
   *
   *  The data structure is opaque/magical and we don't have a good way
   *  to test for the existence of the string in any of the related bundles
   *
   *  Any value is acceptable except `undefined`
   */
  errorLookups.some(errorLookup => (errorString = getString(errorLookup, lang)) !== undefined)

  /**
   *  We have to expect `undefined` even though we don't want it (the original implementation is clear
   *  that this condition is intentional) and default to `errorType` even though it's meaningless
   *
   *  Again, any value is acceptable except `undefined`. We default to returning the `errorType` which
   *  is meaningless to the user. (This is a feature, for now)
   */
  return errorString !== undefined ? normaliseErrorString(errorString, controlInstance, error, lang) : errorType
}

function setControlErrors (pageInstance, errorObjs = []) {
  errorObjs.forEach(errorObj => {
    const instance = jsonPath.query(pageInstance, `$..[?(@._id === "${errorObj.instance._id}")]`)[0] || errorObj.instance
    const controlInstance = setControlError(pageInstance, instance, errorObj.errorType, errorObj.error)
    jsonPath.apply(pageInstance, `$..[?(@._id === "${controlInstance._id}")]`, value => controlInstance)
  })

  return pageInstance
}

function setControlError (pageInstance, controlInstance, errorType, error) {
  if (!checkErrorDisplay(pageInstance, controlInstance, errorType, error, 'control')) {
    return controlInstance
  }

  controlInstance.error = controlInstance.error ? `${controlInstance.error}<br>` : ''
  controlInstance.error += getFormattedError('inline', controlInstance, errorType, error, pageInstance.contentLang)

  return controlInstance
}

function setSummaryErrors (pageInstance, errorObjs = []) {
  // ensure errors are in source order
  const instanceIds = jsonPath.query(pageInstance, '$..[?(@._id)]').map(instance => instance._id)
  const indexMap = {}
  instanceIds.forEach((id, index) => {
    indexMap[instanceIds[index]] = index
  })
  const sortByIndex = (a, b) => {
    const aPos = indexMap[a.instance._id]
    const bPos = indexMap[b.instance._id]
    return aPos < bPos ? -1 : 1
  }
  errorObjs = errorObjs.sort(sortByIndex)

  errorObjs.forEach(errorObj => {
    // console.log('errorObj', errorObj)
    //
    setSummaryError(pageInstance, errorObj.instance, errorObj.errorType, errorObj.error)
  })

  if (errorObjs.length) {
    setSummaryErrorsHeading(pageInstance)
  }
  return pageInstance
}

function checkErrorDisplay (pageInstance, controlInstance, errorType, error, position) {
  pageInstance = setErrorsSeen(pageInstance)
  const errorsSeen = pageInstance.errorsSeen[position]

  if (controlInstance) {
    const {_id} = controlInstance
    const errorSeen = errorsSeen[_id]
    errorsSeen[_id] = errorType
    if (errorSeen) {
      if (errorType === 'required' || errorSeen === 'required') {
        return false
      }
    }
  }
  return true
}

function setSummaryError (pageInstance, controlInstance, errorType, error) {
  if (!checkErrorDisplay(pageInstance, controlInstance, errorType, error, 'summary')) {
    return pageInstance
  }

  let pageError = getFormattedError('summary', controlInstance, errorType, error, pageInstance.contentLang)

  let href

  if (pageError.includes('==/')) {
    pageError = pageError.replace(/==(\/.*)$/, (m, m1) => {
      href = m1
      return ''
    })
  } else {
    let errorId = controlInstance.id || controlInstance._id

    // error on composite component
    if (error && error.compositeInput) {
      errorId = controlInstance.name
      errorId = errorId.replace(/\./g, '--')
      errorId += `-${error.compositeInput}`
    } else if (controlInstance._type === 'radios') {
      // target first radio option
      errorId = `${controlInstance.name}-0`
    } else if (controlInstance._type === 'checkboxes') {
      // target first checkbox option
      errorId = controlInstance.items[0].name
    } else if (error && error.target) {
      errorId = error.target
    } else if (controlInstance._type === 'fileupload') {
      // target first fileupload option
      errorId = `${controlInstance.name}[1]`
    } else if (controlInstance._type === 'mojFileupload') {
      // target first moojFileupload option
      errorId = `${controlInstance.name}[1]`
    }

    if (errorId) {
      // duplicated from nunjucks-configuration
      errorId = errorId.replace(/(\[|\]|\.)/g, '_').replace(/_+/g, '_')
      href = `#${errorId}`
    }
  }

  pageInstance.errorList = pageInstance.errorList || []
  pageInstance.errorList.push({
    html: pageError,
    href
  })

  return pageInstance
}

function setSummaryErrorsHeading (pageInstance) {
  const heading = getString('errors.summary.heading', pageInstance.contentLang) || ''
  pageInstance.errorTitle = format(heading, {errorCount: pageInstance.errorList.length}, {lang: pageInstance.contentLang})
  return pageInstance
}

module.exports = {
  format,
  getInstance,
  getString,
  getInstanceProperty,

  initAddError,
  adjustErrorObjs,
  setErrors,
  setControlErrors,
  setControlError,
  setSummaryErrors,
  checkErrorDisplay,
  setSummaryError,

  setSummaryErrorsHeading,

  getLabelForLang,
  getLegendForLang,

  getFormatParameters,
  getInstanceErrorStringsFromControl,
  hasInstanceErrorString,
  getInstanceErrorString,
  normaliseErrorString,
  getErrorLookupsArray,
  getFormattedError
}
