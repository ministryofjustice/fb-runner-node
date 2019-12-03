require('@ministryofjustice/module-alias/register-module')(module)

const jsonPath = require('jsonpath')

const {
  setErrors
} = require('~/fb-runner-node/page/set-errors/set-errors')

const {
  isRequired,
  validateRequired,
  validateInstanceRequired
} = require('./validate-required/validate-required')

const {
  validateValue,
  validateInstanceValue
} = require('./validate-value/validate-value')

const {
  getInstanceController
} = require('~/fb-runner-node/controller/controller')

const flattenDeep = (arr) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])

function validateInput (pageInstance, userData) {
  const errors = []

  const nameInstances = jsonPath.query(pageInstance, '$..[?(@.name)]')
  const checkboxesInstances = jsonPath.query(pageInstance, '$..[?(@._type === "checkboxes")]')

  let componentErrors = []

  if (nameInstances.length || checkboxesInstances.length) {
    const requiredErrors = validateRequired(pageInstance, userData)
    const valueErrors = validateValue(pageInstance, userData)

    componentErrors = flattenDeep(
      nameInstances
        .map(nameInstance => {
          const componentController = getInstanceController(nameInstance)
          if (componentController.validate) {
            return componentController.validate(nameInstance, userData)
          }
        })
        .filter(error => error)
    )

    errors.push(...requiredErrors)
    errors.push(...valueErrors)

    componentErrors.forEach(errorObj => {
      if (errorObj.instance) {
        errors.push(errorObj)
      }
    })
  }

  const hasErrors = !!errors.length

  if (hasErrors) {
    pageInstance = setErrors(pageInstance, errors)
  }

  componentErrors.forEach(errorObj => {
    if (errorObj.compositeName) {
      const [
        compositeInstance
      ] = jsonPath.query(pageInstance, `$..[?(@.compositeName === "${errorObj.compositeName}")]`)
      if (compositeInstance) {
        compositeInstance.classes = compositeInstance.classes || ''
        if (compositeInstance.classes) {
          compositeInstance.classes += ' '
        }
        compositeInstance.classes += 'govuk-input--error'
      }
    }
  })

  if (hasErrors || pageInstance.errorTitle) {
    pageInstance.$hasErrors = true
  } else {
    pageInstance.$validated = true
  }

  return pageInstance
}

/*
 *  `getInstanceError` and `instanceHasError` are assigned to fields on the function
 */
validateInput.getInstanceError = function getInstanceError (nameInstance, userData) {
  let errors = validateInstanceRequired(nameInstance, userData)

  if (!errors.length) {
    errors = validateInstanceValue(nameInstance, userData)
  }

  return errors.length ? errors : undefined
}

/*
 *  `getInstanceError` and `instanceHasError` are assigned to fields on the function
 */
validateInput.instanceHasError = (nameInstance, userData) => !!validateInput.getInstanceError(nameInstance, userData) // important

module.exports = validateInput
module.exports.isRequired = isRequired
