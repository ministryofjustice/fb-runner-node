const jp = require('jsonpath')

const {setErrors} = require('../set-errors/set-errors')
const {
  isRequired,
  validateRequired,
  validateInstanceRequired
} = require('./validate-required/validate-required')
const {
  validateValue,
  validateInstanceValue
} = require('./validate-value/validate-value')

const {getInstanceController} = require('../../controller/controller')

const validateInput = (pageInstance, userData) => {
  const errors = []

  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const checkboxesInstances = jp.query(pageInstance, '$..[?(@._type === "checkboxes")]')

  let componentErrors = []

  if (nameInstances.length || checkboxesInstances.length) {
    const requiredErrors = validateRequired(pageInstance, userData)
    const valueErrors = validateValue(pageInstance, userData)

    const flattenDeep = (arr) => {
      return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])
    }
    componentErrors = flattenDeep(nameInstances.map(nameInstance => {
      const componentController = getInstanceController(nameInstance)
      if (componentController.validate) {
        return componentController.validate(nameInstance, userData)
      }
    })).filter(error => error)

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
      const compositeInstance = jp.query(pageInstance, `$..[?(@.compositeName === "${errorObj.compositeName}")]`)[0]
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

validateInput.getInstanceError = (nameInstance, userData) => {
  let errors = validateInstanceRequired(nameInstance, userData)
  if (!errors.length) {
    errors = validateInstanceValue(nameInstance, userData)
  }
  return errors.length ? errors : undefined
}

validateInput.instanceHasError = (nameInstance, userData) => {
  return !!validateInput.getInstanceError(nameInstance, userData)
}

validateInput.isRequired = isRequired

module.exports = validateInput
