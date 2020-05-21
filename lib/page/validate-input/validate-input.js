require('@ministryofjustice/module-alias/register-module')(module)

const jsonPath = require('jsonpath')

const {
  setErrors
} = require('~/fb-runner-node/page/set-errors/set-errors')

const {
  isRequired,
  validateRequired,
  validateInstanceRequired
} = require('./validate-required/validate-required')

const {
  validateValue,
  validateInstanceValue
} = require('./validate-value/validate-value')

const getPageController = require('~/fb-runner-node/controller/component/get-controller')

const flattenDeep = (arr) => arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), [])

function validateInput (pageInstance, userData) {
  const errors = []

  const nameInstances = jsonPath.query(pageInstance, '$..[?(@.name)]')
  const checkboxesInstances = jsonPath.query(pageInstance, '$..[?(@._type === "checkboxes")]')

  let componentErrors = []

  if (nameInstances.length || checkboxesInstances.length) {
    const requiredErrors = validateRequired(pageInstance, userData)
    const valueErrors = validateValue(pageInstance, userData)

    componentErrors = flattenDeep(nameInstances.reduce((accumulator, component) => {
      const controller = getPageController(component)
      if (controller.validate) {
        const possibleError = controller.validate(component, userData, pageInstance)
        if (possibleError) {
          return accumulator.concat(possibleError)
        }
      }
      return accumulator
    }, []))

    errors.push(...requiredErrors)
    errors.push(...valueErrors)
    errors.push(...componentErrors.filter((componentError) => Reflect.has(componentError, 'instance')))
  }

  const hasErrors = !!errors.length

  if (hasErrors) {
    pageInstance = setErrors(pageInstance, errors)
  }

  componentErrors.forEach(({ compositeName }) => {
    if (compositeName) {
      const [
        compositeInstance
      ] = jsonPath.query(pageInstance, `$..[?(@.compositeName === "${compositeName}")]`)

      if (compositeInstance) {
        const {
          classes = ''
        } = compositeInstance

        compositeInstance.classes = `${classes} govuk-input--error`.trim()
      }
    }
  })

  pageInstance.$hasErrors = false
  pageInstance.$validated = false

  /*
   *  Either it has errors (and is not validated)
   *  or it has validated (and has no errors)
   */
  if (hasErrors || pageInstance.errorTitle) {
    pageInstance.$hasErrors = true
  } else {
    pageInstance.$validated = true
  }

  return pageInstance
}

/*
 *  `getInstanceError` and `instanceHasError` are assigned to fields on the function
 */
validateInput.getInstanceError = function getInstanceError (nameInstance, userData) {
  let errors = validateInstanceRequired(nameInstance, userData)

  if (!errors.length) {
    errors = validateInstanceValue(nameInstance, userData)
  }

  return errors.length ? errors : undefined
}

/*
 *  `getInstanceError` and `instanceHasError` are assigned to fields on the function
 */
validateInput.instanceHasError = (nameInstance, userData) => !!validateInput.getInstanceError(nameInstance, userData) // important

module.exports = validateInput
module.exports.isRequired = isRequired
