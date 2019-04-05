const jp = require('jsonpath')
const {default: produce} = require('immer')

const {setErrors} = require('../set-errors/set-errors')
const validateRequired = require('./validate-required/validate-required')
const validateValue = require('./validate-value/validate-value')

const components = require('../component/component')

const validateInput = (pageInstance, userData) => {
  let errors = []

  // pageInstance = produce(pageInstance, draft => {
  //   jp.apply(draft, '$..["$original"]', () => {})
  //   // jp.apply(draft, '$..[?(@.$original)]', (value) => {
  //   //   delete value.$original
  //   //   return value
  //   // })
  // })

  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const checkboxesInstances = jp.query(pageInstance, '$..[?(@._type === "checkboxes")]')

  let componentErrors = []

  if (nameInstances.length || checkboxesInstances.length) {
    const requiredErrors = validateInput.validateRequired(pageInstance, userData)
    const valueErrors = validateInput.validateValue(pageInstance, userData)

    const flattenDeep = (arr) => {
      return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])
    }
    componentErrors = flattenDeep(nameInstances.map(nameInstance => {
      const {_type} = nameInstance
      let componentController = components[_type] || {}
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
    validatedPageInstance = validateInput.setErrors(validatedPageInstance, errors)
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

validateInput.setErrors = setErrors
validateInput.validateRequired = validateRequired
validateInput.validateValue = validateValue

module.exports = validateInput
