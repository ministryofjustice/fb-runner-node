const jp = require('jsonpath')

const {setErrors} = require('../set-errors/set-errors')
const validateRequired = require('./validate-required/validate-required')
const validateValue = require('./validate-value/validate-value')

const validateInput = (pageInstance, userData) => {
  let errors = []

  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const checkboxesInstances = jp.query(pageInstance, '$..[?(@._type === "checkboxes")]')

  if (nameInstances.length || checkboxesInstances.length) {
    const requiredErrors = validateInput.validateRequired(nameInstances, pageInstance, userData)
    const valueErrors = validateInput.validateValue(nameInstances, userData)

    errors = [].concat(requiredErrors, valueErrors)
  }

  if (errors.length) {
    validateInput.setErrors(pageInstance, errors)
    pageInstance.$hasErrors = true
  } else {
    pageInstance.$validated = true
  }

  return pageInstance
}

validateInput.setErrors = setErrors
validateInput.validateRequired = validateRequired
validateInput.validateValue = validateValue

module.exports = validateInput
