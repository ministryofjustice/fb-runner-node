const {getNormalisedUploadControlName} = require('../utils/utils')

const registerUploadErrors = (fileErrors) => {
  console.log('processedFileErrors', JSON.stringify(fileErrors, null, 2))

  if (fileErrors) {
    Object.keys(fileErrors).forEach(errorType => {
      const errors = fileErrors[errorType]
      errors.forEach(error => {
        const {fieldname} = error
        const realFieldName = getNormalisedUploadControlName(fieldname)
        console.log('Registering error', errorType, {
          control: realFieldName,
          originalname: error.originalname
        })
      })
    })
  }
}

module.exports = registerUploadErrors
