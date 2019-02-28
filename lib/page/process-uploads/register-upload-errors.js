const {getNormalisedUploadControlName} = require('../utils/utils')

const registerError = (errorType, control, originalname) => {
  console.log('Registering error', errorType, { // eslint-disable-line no-console
    control,
    originalname
  })
}

const registerUploadErrors = (fileErrors) => {
  if (fileErrors) {
    Object.keys(fileErrors).forEach(errorType => {
      const errors = fileErrors[errorType]
      errors.forEach(error => {
        const {fieldname} = error
        const realFieldName = getNormalisedUploadControlName(fieldname)
        registerError(errorType, realFieldName, error.originalname)
      })
    })
  }
}

module.exports = registerUploadErrors
