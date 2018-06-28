const jp = require('jsonpath')

const validateRequired = require('./validate-required/validate-required')
const validateValue = require('./validate-value/validate-value')

const validateInput = (page, siteData, getPath, evaluateInput) => {
  const nameInstances = jp.query(page, '$..[?(@.name)]')

  const requiredErrors = validateRequired(nameInstances, page, siteData, getPath, evaluateInput)
  const valueErrors = validateValue(nameInstances, page, siteData, getPath, evaluateInput)

  let hasErrors = requiredErrors || valueErrors
  return hasErrors
}

module.exports = validateInput
