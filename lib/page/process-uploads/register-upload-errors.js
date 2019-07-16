const {getString} = require('../../service-data/service-data')
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
        let uploadErrorString = `fileupload.${errorMessage || errorType}`
        if (!getString(`error.${uploadErrorString}`)) {
          uploadErrorString = 'fileupload'
        }
        console.log({controlName, fieldname})
        addError(uploadErrorString, controlName, {
          values: {
            filename: error.originalname,
            maxSize: error.maxSize
          },
          target: fieldname
        })
      })
    })
    pageInstance = setErrors(pageInstance, errors)
  }
  return pageInstance
}

module.exports = registerUploadErrors
