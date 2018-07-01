const jp = require('jsonpath')

const {setErrors} = require('../set-errors/set-errors')
const validateRequired = require('./validate-required/validate-required')
const validateValue = require('./validate-value/validate-value')

const validateInput = (pageInstance, getPath, evaluateInput) => {
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')

  const requiredErrors = validateRequired(nameInstances, pageInstance, getPath, evaluateInput)
  const valueErrors = validateValue(nameInstances, getPath)

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
