const jp = require('jsonpath')
const {default: produce} = require('immer')
const jsonschema = require('jsonschema')
const validator = new jsonschema.Validator()

const {initAddError} = require('../../set-errors/set-errors')
const {getServiceSchema} = require('../../../service-data/service-data')

const validateValue = (pageInstance, userData) => {
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const {getUserDataProperty} = userData

  let errors = []
  const addError = initAddError(errors)

  // perform validation
  nameInstances.forEach(nameInstance => {
    if (nameInstance.error) {
      return errors
    }
    const normalisedNameInstance = produce(nameInstance, draft => {
      if (!draft.validation) {
        draft.validation = {}
      }
      const schema = validateValue.getServiceSchema(draft._type)
      if (schema && schema.validation) {
        draft.validation = Object.assign(draft.validation, schema.validation)
      }
      // TODO: this needs to come from the specification
      // also would be good to use that info for storing the info as well
      if (!draft.validation.type) {
        draft.validation.type = draft._type === 'number' ? 'number' : 'string'
      }
    })
    const validationLength = Object.keys(normalisedNameInstance.validation).length
    if (!validationLength) {
      return errors
    }
    if (validationLength === 1 && normalisedNameInstance.validation.required !== undefined) {
      return errors
    }

    let value = getUserDataProperty(normalisedNameInstance.name)
    // TODO: think through whether other types need additional hand-holding
    if (normalisedNameInstance._type === 'number') {
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

    let validationError = validator.validate(value, normalisedNameInstance.validation).errors[0]
    if (validationError) {
      addError(validationError.name, nameInstance, validationError)
    }
  })

  return errors
}
validateValue.getServiceSchema = getServiceSchema

module.exports = validateValue
