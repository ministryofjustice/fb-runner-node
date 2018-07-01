const jp = require('jsonpath')

const {setErrors} = require('../set-errors/set-errors')
const validateRequired = require('./validate-required/validate-required')
const validateValue = require('./validate-value/validate-value')

const validateInput = (pageInstance, getUserDataProperty, evaluateInput) => {
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')

  const requiredErrors = validateRequired(nameInstances, pageInstance, getUserDataProperty, evaluateInput)
  const valueErrors = validateValue(nameInstances, getUserDataProperty)

  const errors = [].concat(requiredErrors, valueErrors)

  if (errors.length) {
    setErrors(pageInstance, errors)
    pageInstance.$hasErrors = true
  } else {
    pageInstance.$validated = true
  }

  return pageInstance
}

module.exports = validateInput
