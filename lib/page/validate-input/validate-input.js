const jp = require('jsonpath')

const {setControlError, setSummaryErrors} = require('../set-errors/set-errors')

const validateRequired = require('./validate-required/validate-required')
const validateValue = require('./validate-value/validate-value')

const validateInput = (page, siteData, getPath, evaluateInput) => {
  const nameInstances = jp.query(page, '$..[?(@.name)]')

  const requiredErrors = validateRequired(nameInstances, page, getPath, evaluateInput)
  const valueErrors = validateValue(nameInstances, getPath)

  const errors = [].concat(requiredErrors, valueErrors)
  errors.forEach(errorObj => {
    setControlError(siteData, page, errorObj.instance, errorObj.errorType, errorObj.error)
  })

  let hasErrors = errors.length

  if (hasErrors) {
    setSummaryErrors(page, siteData)
  } else {
    page.$validated = true
  }

  return page
}

module.exports = validateInput
