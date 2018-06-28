const jsonschema = require('jsonschema')
const validator = new jsonschema.Validator()

const registerError = require('../../register-error/register-error')

const validateValue = (nameInstances, page, siteData, getPath, evaluateInput) => {
  let hasErrors = false

  // perform validation
  nameInstances.forEach(nameInstance => {
    if (nameInstance.error) {
      return
    }
    const validationLength = Object.keys(nameInstance.validation).length
    if (!validationLength) {
      return
    }
    if (validationLength === 1 && nameInstance.validation.required !== undefined) {
      return
    }
    // TODO: this needs to come from the specification
    // also would be good to use that info for storing the info as well
    nameInstance.validation.type = nameInstance._type === 'number' ? 'number' : 'text'

    let value = getPath(nameInstance.name)
    if (nameInstance._type === 'number') {
      const originalValue = value
      value = value * 1
      if (isNaN(value)) {
        value = originalValue
      }
    }
    // No value - don't validate
    // TODO: think through whether this is really sufficient
    if (value === '' || value === undefined) {
      return
    }
    let validationError = validator.validate(value, nameInstance.validation).errors[0]
    if (validationError) {
      hasErrors = registerError(siteData, page, nameInstance, validationError.name, validationError)
    }
  })

  return hasErrors
}

module.exports = validateValue
