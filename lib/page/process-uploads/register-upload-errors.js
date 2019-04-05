const {initAddError, setErrors} = require('../set-errors/set-errors')

const {getNormalisedUploadControlName} = require('../utils/utils-controls')

const registerUploadErrors = (pageInstance, fileErrors) => {
  if (fileErrors) {
    let errors = []
    const addError = initAddError(errors)
    Object.keys(fileErrors).forEach(errorType => {
      const errors = fileErrors[errorType]
      errors.forEach(error => {
        const {fieldname, errorMessage} = error
        const controlName = getNormalisedUploadControlName(fieldname)
        addError(`fileupload.${errorMessage}`, controlName, {
          values: {
            filename: error.originalname
          }
        })
      })
    })
    pageInstance = setErrors(pageInstance, errors)
  }
  return pageInstance
}

module.exports = registerUploadErrors
