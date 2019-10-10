const {getString} = require('../../service-data/service-data')
const {initAddError, setErrors} = require('../set-errors/set-errors')
const {getNormalisedUploadControlName} = require('../utils/utils-controls')
const jp = require('jsonpath')

const value_for_language = (object, key, lang) => {
  const defaultLang = 'en'
  let lookupKey

  if (lang === defaultLang) {
    lookupKey = key
  } else {
    lookupKey = `${key}:${lang}`
  }

  const { [lookupKey]: value } = object

  return value
}

const registerUploadErrors = (pageInstance, userData, fileErrors) => {
  if (fileErrors) {
    const errors = []
    const addError = initAddError(errors)
    Object.keys(fileErrors).forEach(errorType => {
      const errors = fileErrors[errorType]
      errors.forEach(error => {
        const {fieldname, errorMessage} = error
        const controlName = getNormalisedUploadControlName(fieldname)
        const body = userData.getBodyInput()
        const uploadSlots = body[`${controlName}_slots`] || 1
        const errorName = errorMessage || errorType

        let uploadErrorString = `fileupload.${errorName}`
        if (uploadSlots > 1) {
          const uploadErrorStringMultiple = `${uploadErrorString}.multiple`
          if (getString(`error.${uploadErrorStringMultiple}`)) {
            uploadErrorString = uploadErrorStringMultiple
          }
        }
        if (!getString(`error.${uploadErrorString}`)) {
          uploadErrorString = 'fileupload'
        }

        const control = jp.query(pageInstance, `$..[?(@.name === "${controlName}")]`)[0] || {}
        const {
          errors: {
            [errorName]: object = {}
          } = {},
          validation = {}
        } = control

        const message = value_for_language(object, 'any', userData.lang) || uploadErrorString

        addError(message, controlName, {
          values: {
            filename: error.originalname,
            maxSize: validation.maxSize
          },
          target: `${controlName}[1]`
        })
      })
    })
    pageInstance = setErrors(pageInstance, errors)
  }
  return pageInstance
}

module.exports = registerUploadErrors
