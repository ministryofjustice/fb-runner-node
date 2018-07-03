const jp = require('jsonpath')
const jsonschema = require('jsonschema')
const validator = new jsonschema.Validator()

const validateValue = (pageInstance, userData) => {
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const {getUserDataProperty} = userData

  let errors = []
  const addError = (instance, errorType, error) => {
    errors.push({
      instance,
      errorType,
      error
    })
  }

  // perform validation
  nameInstances.forEach(nameInstance => {
    if (nameInstance.error) {
      return errors
    }
    if (!nameInstance.validation) {
      nameInstance.validation = {}
      // TODO: this needs to come from the specification
      // also would be good to use that info for storing the info as well
      nameInstance.validation.type = nameInstance._type === 'number' ? 'number' : 'string'
    }
    const validationLength = Object.keys(nameInstance.validation).length
    if (!validationLength) {
      return errors
    }
    if (validationLength === 1 && nameInstance.validation.required !== undefined) {
      return errors
    }

    let value = getUserDataProperty(nameInstance.name)
    // TODO: think through whether other types need additional hand-holding
    if (nameInstance._type === 'number') {
      if (value !== '') {
        const originalValue = value
        value = value * 1
        if (isNaN(value)) {
          value = originalValue
        }
      }
    }

    // No value - don't validate
    // TODO: think through whether this is really sufficient
    if (value === '' || value === undefined) {
      return errors
    }

    let validationError = validator.validate(value, nameInstance.validation).errors[0]
    if (validationError) {
      addError(nameInstance, validationError.name, validationError)
    }
  })

  return errors
}

module.exports = validateValue
