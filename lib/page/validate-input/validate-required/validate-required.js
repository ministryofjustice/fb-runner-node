const jp = require('jsonpath')
const {default: produce} = require('immer')

const {getServiceSchema} = require('../../../service-data/service-data')
const {evaluateInput} = require('../../../evaluate-condition/evaluate-condition')
const {initAddError} = require('../../set-errors/set-errors')

const components = require('../../component/component')

const validateRequired = (pageInstance, userData) => {
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const checkboxesInstances = jp.query(pageInstance, '$..[?(@._type === "checkboxes")]')
  const {getUserDataProperty} = userData

  let errors = []
  const addError = initAddError(errors)

  const normaliseValidation = (instance) => {
    return produce(instance, draft => {
      draft.validation = draft.validation || {}
      const schema = validateRequired.getServiceSchema(draft._type)
      if (schema && schema.validation) {
        draft.validation = Object.assign(draft.validation, schema.validation)
      }
      draft.errors = draft.errors || {}
      return draft
    })
  }

  const getRequired = (instance, defaultValue = true) => {
    // TODO: fix checkbox specification
    if (instance._type === 'checkbox') {
      return false
    }
    let requiredCondition = instance.validation.required
    if (requiredCondition === undefined) {
      // TODO: fix checkboxes specification
      // const schemaValidation = schemas[instance._type].properties.validation
      // const defaultRequired = schemaValidation ? schemaValidation.properties.required
      // const defaultValue = defaultRequired ? defaultRequired['default'] : true
      requiredCondition = defaultValue
    }
    return evaluateInput(requiredCondition, userData.getUserData())
  }

  // ensure name instances have a validation property
  // nameInstances.forEach(normaliseValidation)

  // perform required check
  nameInstances.forEach(nameInstance => {
    const normalisedNameInstance = normaliseValidation(nameInstance)
    const {_type} = nameInstance
    const schema = validateRequired.getServiceSchema(_type)
    if (!schema || !schema.properties || !schema.properties.name || !schema.properties.name.processInput) {
      return
    }
    const required = getRequired(normalisedNameInstance)
    if (required) {
      let composite = schema.composite
      // if component has a getComposite method, call it
      if (components[_type] && components[_type].getComposite) {
        composite = components[_type].getComposite(nameInstance)
      }
      if (composite) {
        let compositeErrors = 0
        composite.forEach(item => {
          let itemValue = getUserDataProperty(`${normalisedNameInstance.name}-${item}`)
          if (typeof itemValue === 'string') {
            itemValue = itemValue.trim()
            if (!itemValue) {
              itemValue = undefined
            }
          }
          if (itemValue === undefined) {
            // addError('required', `${normalisedNameInstance.name}-${item}`)
            compositeErrors++
          }
        })
        if (compositeErrors) {
          addError('required', nameInstance)
        }
        return
      }
      let nameValue = getUserDataProperty(normalisedNameInstance.name)
      if (typeof nameValue === 'string') {
        nameValue = nameValue.trim()
        if (!nameValue) {
          nameValue = undefined
        }
      }
      if (nameValue === undefined) {
        addError('required', nameInstance)
      }
    }
  })

  // checkboxesInstances.forEach(normaliseValidation)
  checkboxesInstances.forEach(checkboxesInstance => {
    const normalisedCheckboxesInstance = normaliseValidation(checkboxesInstance)
    // NB. this is a bug - checkboxes should not be required by default. Update specification accordingly
    const required = getRequired(normalisedCheckboxesInstance, false)
    if (required) {
      const checkboxInstances = normalisedCheckboxesInstance.items.filter(checkbox => checkbox.name)
      let checked = false
      checkboxInstances.forEach(checkbox => {
        const checkboxValue = getUserDataProperty(checkbox.name)
        if (checkboxValue && checkboxValue === checkbox.value) {
          checked = true
        }
      })
      if (!checked) {
        addError('required', checkboxesInstance)
      }
    }
  })

  return errors
}
validateRequired.getServiceSchema = getServiceSchema

module.exports = validateRequired
