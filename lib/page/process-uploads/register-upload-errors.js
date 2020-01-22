require('@ministryofjustice/module-alias/register-module')(module)

const {
  initAddError,
  setErrors
} = require('~/fb-runner-node/page/set-errors/set-errors')

const {
  getComponentName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  getComponentMaxFiles,
  getComponentMinFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const jsonPath = require('jsonpath')

module.exports = function registerUploadErrors (pageInstance, userData, fileErrors) {
  if (fileErrors) {
    const errors = []
    const addError = initAddError(errors)

    Object.entries(fileErrors)
      .forEach(([errorType, errorList]) => {
        errorList.forEach(({fieldname, errorMessage, originalname: filename}) => {
          const componentName = getComponentName(fieldname)
          const [
            control = {}
          ] = jsonPath.query(pageInstance, `$..[?(@.name === "${componentName}")]`)

          const maxFiles = getComponentMaxFiles(control)
          const minFiles = getComponentMinFiles(control)
          const isMultiple = maxFiles > 1 || minFiles > 1

          const {
            validation = {}
          } = control

          const type = errorMessage || (isMultiple ? `${errorType}.multiple` : errorType)

          addError(type, componentName, {
            values: {
              filename,
              maxFiles,
              minFiles,
              maxSize: validation.maxSize,
              accept: validation.accept
            },
            target: `${componentName}[1]`
          })
        })
      })

    pageInstance = setErrors(pageInstance, errors)
  }

  return pageInstance
}
