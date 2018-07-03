const jp = require('jsonpath')

const {default: produce} = require('immer')

const {setErrors} = require('../set-errors/set-errors')
const validateRequired = require('./validate-required/validate-required')
const validateValue = require('./validate-value/validate-value')

const validateInput = (pageInstance, userData) => {
  let errors = []

  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const checkboxesInstances = jp.query(pageInstance, '$..[?(@._type === "checkboxes")]')

  if (nameInstances.length || checkboxesInstances.length) {
    const requiredErrors = validateInput.validateRequired(pageInstance, userData)
    const valueErrors = validateInput.validateValue(pageInstance, userData)

    errors = [].concat(requiredErrors, valueErrors)
  }

  const hasErrors = !!errors.length

  let validatedPageInstance = pageInstance

  if (hasErrors) {
    validatedPageInstance = validateInput.setErrors(validatedPageInstance, errors)
  }

  validatedPageInstance = produce(validatedPageInstance, draft => {
    if (hasErrors) {
      draft.$hasErrors = true
    } else {
      draft.$validated = true
    }
    return draft
  })

  return validatedPageInstance
}

validateInput.setErrors = setErrors
validateInput.validateRequired = validateRequired
validateInput.validateValue = validateValue

module.exports = validateInput
