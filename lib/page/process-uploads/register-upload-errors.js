require('@ministryofjustice/module-alias/register-module')(module)

const {initAddError, setErrors} = require('~/fb-runner-node/page/set-errors/set-errors')

const {
  getUploadControlName
} = require('~/fb-runner-node/page/utils/utils-controls')

const jsonPath = require('jsonpath')

module.exports = function registerUploadErrors (pageInstance, userData, fileErrors) {
  if (fileErrors) {
    const bodyInput = userData.getBodyInput()
    const errors = []
    const addError = initAddError(errors)

    Object.entries(fileErrors)
      .forEach(([errorType, errorList]) => {
        errorList.forEach(({fieldname, errorMessage, originalname: filename}) => {
          const controlName = getUploadControlName(fieldname)
          const uploadSlots = bodyInput[`${controlName}_slots`] || 1

          const control = jsonPath.query(pageInstance, `$..[?(@.name === "${controlName}")]`).shift() || {}
          const {
            validation = {}
          } = control

          const type = errorMessage || (uploadSlots > 1 ? `${errorType}.multiple` : errorType)

          addError(type, controlName, {
            values: {
              filename,
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
