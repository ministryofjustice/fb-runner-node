const jp = require('jsonpath')
const {default: produce} = require('immer')

const {setErrors} = require('../set-errors/set-errors')
const validateRequired = require('./validate-required/validate-required')
const validateValue = require('./validate-value/validate-value')

const validateInput = (pageInstance, userData) => {
  let errors = []

  pageInstance = produce(pageInstance, draft => {
    jp.apply(draft, '$..["$original"]', () => {})
    // jp.apply(draft, '$..[?(@.$original)]', (value) => {
    //   delete value.$original
    //   return value
    // })
  })

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
