const jp = require('jsonpath')
const {default: produce} = require('immer')

const {setErrors} = require('../set-errors/set-errors')
const {
  validateRequired,
  validateInstanceRequired
} = require('./validate-required/validate-required')
const {
  validateValue,
  validateInstanceValue
} = require('./validate-value/validate-value')

const {getInstanceController} = require('../../controller/controller')

const validateInput = (pageInstance, userData) => {
  let errors = []

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

  let validatedPageInstance = pageInstance

  if (hasErrors) {
    validatedPageInstance = setErrors(validatedPageInstance, errors)
  }

  componentErrors.forEach(errorObj => {
    if (errorObj.compositeName) {
      validatedPageInstance = produce(validatedPageInstance, draft => {
        const compositeInstance = jp.query(draft, `$..[?(@.compositeName === "${errorObj.compositeName}")]`)[0]
        if (compositeInstance) {
          compositeInstance.classes = compositeInstance.classes || ''
          if (compositeInstance.classes) {
            compositeInstance.classes += ' '
          }
          compositeInstance.classes += 'govuk-input--error'
        }
        return draft
      })
    }
  })

  validatedPageInstance = produce(validatedPageInstance, draft => {
    if (hasErrors || validatedPageInstance.errorTitle) {
      draft.$hasErrors = true
    } else {
      draft.$validated = true
    }
    return draft
  })

  return validatedPageInstance
}

const instanceError = (nameInstance, userData) => {
  let errors = validateInstanceRequired(nameInstance, userData)
  if (!errors.length) {
    errors = validateInstanceValue(nameInstance, userData)
  }
  return errors.length ? errors : undefined
}

const instanceHasError = (nameInstance, userData) => {
  const errors = validateInstanceValue(nameInstance, userData)
  return !!errors.length
}

validateInput.instanceError = instanceError
validateInput.instanceHasError = instanceHasError

module.exports = validateInput
