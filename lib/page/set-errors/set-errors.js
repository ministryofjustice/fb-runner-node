const jp = require('jsonpath')

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

function setErrorsSeen (pageInstance) {
  if (!pageInstance.errorsSeen) {
    pageInstance.errorsSeen = {
      summary: {},
      control: {}
    }
  }
  return pageInstance
}

external.setErrors = (pageInstance, errorObjs) => {
  const adjustedErrorObjs = external.adjustErrorObjs(pageInstance, errorObjs)

  pageInstance = setErrorsSeen(pageInstance)

  pageInstance = external.setControlErrors(pageInstance, adjustedErrorObjs)
  pageInstance = external.setSummaryErrors(pageInstance, adjustedErrorObjs)
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

function getFormatParameters (controlInstance = {}, error, lang) {
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
  return [
    // errorType.controlType.location summary or inline
    // eg. error.required.text.inline
    `error.${errorType}.${controlInstanceType}.${position}`,
    // errorType.controlType
    // eg. error.required.text
    `error.${errorType}.${controlInstanceType}`,
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
     *  We do. Let's get it. (It could be any primitive, object, array, null, etc.
     *  implementation only cares about `undefined`)
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
   *  Truthiness?
   *
   */
  errorLookups.some(errorLookup => !!(errorString = external.getString(errorLookup, lang)))

  /**
   *  We have to expect `undefined` even though we don't want it (the original implementation is clear
   *  that this condition is intentional) and default to `errorType` even though it's meaningless
   *
   *  Again, we must accept empty strings and other falsy values, so we explicitly test `undefined`
   */
  return errorString === undefined ? errorType : normaliseErrorString(errorString, controlInstance, error, lang)
}

external.getFormatParameters = getFormatParameters

external.getInstanceErrorStringsFromControl = getInstanceErrorStringsFromControl

external.hasInstanceErrorString = hasInstanceErrorString

external.getInstanceErrorString = getInstanceErrorString

external.normaliseErrorString = normaliseErrorString

external.getErrorLookupsArray = getErrorLookupsArray

external.getFormattedError = getFormattedError

external.setControlErrors = (pageInstance, errorObjs = []) => {
  errorObjs.forEach(errorObj => {
    const instance = jp.query(pageInstance, `$..[?(@._id === "${errorObj.instance._id}")]`)[0] || errorObj.instance
    const controlInstance = external.setControlError(pageInstance, instance, errorObj.errorType, errorObj.error)
    jp.apply(pageInstance, `$..[?(@._id === "${controlInstance._id}")]`, value => controlInstance)
  })

  return pageInstance
}

external.setControlError = (pageInstance, controlInstance, errorType, error) => {
  if (!external.checkErrorDisplay(pageInstance, controlInstance, errorType, error, 'control')) {
    return controlInstance
  }

  controlInstance.error = controlInstance.error ? `${controlInstance.error}<br>` : ''
  controlInstance.error += external.getFormattedError('inline', controlInstance, errorType, error, pageInstance.contentLang)

  return controlInstance
}

external.setSummaryErrors = (pageInstance, errorObjs = []) => {
  // ensure errors are in source order
  const instanceIds = jp.query(pageInstance, '$..[?(@._id)]').map(instance => instance._id)
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
    external.setSummaryError(pageInstance, errorObj.instance, errorObj.errorType, errorObj.error)
  })
  if (errorObjs.length) {
    external.setSummaryErrorsHeading(pageInstance)
  }
  return pageInstance
}

external.checkErrorDisplay = (pageInstance, controlInstance, errorType, error, position) => {
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

external.setSummaryError = (pageInstance, controlInstance, errorType, error) => {
  if (!external.checkErrorDisplay(pageInstance, controlInstance, errorType, error, 'summary')) {
    return pageInstance
  }

  let pageError = external.getFormattedError('summary', controlInstance, errorType, error, pageInstance.contentLang)

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
      // target first fielupload option
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

external.setSummaryErrorsHeading = (pageInstance) => {
  const heading = external.getString('errors.summary.heading', pageInstance.contentLang) || ''
  pageInstance.errorTitle = external.format(heading, {errorCount: pageInstance.errorList.length}, {lang: pageInstance.contentLang})
  return pageInstance
}

module.exports = external
