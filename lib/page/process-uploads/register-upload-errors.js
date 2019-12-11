require('@ministryofjustice/module-alias/register-module')(module)

const {
  initAddError,
  setErrors
} = require('~/fb-runner-node/page/set-errors/set-errors')

const {
  getUploadControlName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  getUploadMaxFiles,
  getUploadMinFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const jsonPath = require('jsonpath')

module.exports = function registerUploadErrors (pageInstance, userData, fileErrors) {
  if (fileErrors) {
    const errors = []
    const addError = initAddError(errors)

    Object.entries(fileErrors)
      .forEach(([errorType, errorList]) => {
        errorList.forEach(({fieldname, errorMessage, originalname: filename}) => {
          const controlName = getUploadControlName(fieldname)
          const [
            control = {}
          ] = jsonPath.query(pageInstance, `$..[?(@.name === "${controlName}")]`)

          const maxFiles = getUploadMaxFiles(control)
          const minFiles = getUploadMinFiles(control)
          const isMultiple = maxFiles > 1 || minFiles > 1

          const {
            validation = {}
          } = control

          const type = errorMessage || (isMultiple ? `${errorType}.multiple` : errorType)

          addError(type, controlName, {
            values: {
              filename,
              maxFiles,
              minFiles,
              maxSize: validation.maxSize,
              accept: validation.accept
            },
            target: `${controlName}[1]`
          })
        })
      })

    pageInstance = setErrors(pageInstance, errors)
  }

  return pageInstance
}
