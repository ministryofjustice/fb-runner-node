require('module-alias/register')

const {initAddError, setErrors} = require('~/page/set-errors/set-errors')
const {getNormalisedUploadControlName} = require('~/page/utils/utils-controls')
const jp = require('jsonpath')

module.exports = function registerUploadErrors (pageInstance, userData, fileErrors) {
  if (fileErrors) {
    const bodyInput = userData.getBodyInput()
    const errors = []
    const addError = initAddError(errors)

    Object.entries(fileErrors)
      .forEach(([errorType, errorList]) => {
        errorList.forEach(({fieldname, errorMessage, originalname: filename}) => {
          const controlName = getNormalisedUploadControlName(fieldname)
          const uploadSlots = bodyInput[`${controlName}_slots`] || 1

          const control = jp.query(pageInstance, `$..[?(@.name === "${controlName}")]`).shift() || {}
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
