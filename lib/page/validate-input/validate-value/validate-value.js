require('@ministryofjustice/module-alias/register-module')(module)

const jp = require('jsonpath')
const jsonschema = require('jsonschema')
const validator = new jsonschema.Validator()
const cloneDeep = require('lodash.clonedeep')

const { initAddError } = require('~/fb-runner-node/page/set-errors/set-errors')
const { getServiceSchema } = require('~/fb-runner-node/service-data/service-data')

const validateValue = (pageInstance, userData) => {
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const { getUserDataProperty } = userData

  const errors = []
  const addError = initAddError(errors)

  // perform validation
  nameInstances.forEach(nameInstance => {
    if (nameInstance.error) {
      return errors
    }

    // don't check composite values
    if (nameInstance.$originalName) {
      return errors
    }
    // don't check uploads
    if (nameInstance._type === 'upload') {
      return errors
    }

    if (!nameInstance.validation) {
      nameInstance.validation = {}
    }
    const schema = validateValue.getServiceSchema(nameInstance._type)
    if (schema && schema.validation) {
      nameInstance.validation = Object.assign(nameInstance.validation, schema.validation)
    }

    const validationLength = Object.keys(nameInstance.validation).length
    if (validationLength === 1 && nameInstance.validation.required !== undefined) {
      return errors
    }

    // TODO: this needs to come from the specification
    // also would be good to use that info for storing the info as well
    if (!nameInstance.validation.type) {
      nameInstance.validation.type = nameInstance._type === 'number' ? 'number' : 'string'
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

    const validationError = validator.validate(value, nameInstance.validation).errors[0]
    if (validationError) {
      addError(validationError.name, nameInstance, validationError)
    }
  })

  return errors
}
validateValue.getServiceSchema = getServiceSchema

const validateInstanceValue = (nameInstance, userData) => {
  const doubleCheckInstance = cloneDeep(nameInstance)
  return validateValue({ components: [doubleCheckInstance] }, userData)
}

module.exports = {
  validateValue,
  validateInstanceValue
}
