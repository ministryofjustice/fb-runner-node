const jp = require('jsonpath')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {getServiceSchema} = require('../../../service-data/service-data')
const {initAddError} = require('../../set-errors/set-errors')
const getComponentComposite = require('../../../controller/component/get-composite')

const isRequired = (instance, userData) => {
  // TODO: fix checkbox specification
  if (instance._type === 'checkbox') {
    return false
  }
  if (instance._type === 'button') {
    return false
  }
  if (instance.$conditionalShow) {
    const conditionallyShow = userData.evaluate(instance.$conditionalShow, {
      instance
    })
    if (!conditionallyShow) {
      return false
    }
  }
  instance.validation = instance.validation || {}
  let requiredCondition = instance.validation.required
  if (requiredCondition === undefined) {
    let defaultValue = true
    if (instance._type === 'checkboxes') {
      defaultValue = false
    }
    // TODO: fix checkboxes specification
    // const schemaValidation = schemas[instance._type].properties.validation
    // const defaultRequired = schemaValidation ? schemaValidation.properties.required
    // const defaultValue = defaultRequired ? defaultRequired['default'] : true
    requiredCondition = defaultValue
  }
  return userData.evaluate(requiredCondition, {
    instance
  })
}

const validateRequired = (pageInstance, userData) => {
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const checkboxesInstances = jp.query(pageInstance, '$..[?(@._type === "checkboxes")]')
  const {getUserDataProperty} = userData

  const errors = []
  const addError = initAddError(errors)

  const normaliseValidation = (instance) => {
    instance.validation = instance.validation || {}
    const schema = validateRequired.getServiceSchema(instance._type)
    if (schema && schema.validation) {
      instance.validation = Object.assign(instance.validation, schema.validation)
    }
    instance.errors = instance.errors || {}
    return instance
  }

  // ensure name instances have a validation property
  // nameInstances.forEach(normaliseValidation)

  // perform required check
  nameInstances.forEach(nameInstance => {
    if (nameInstance.$skipValidation) {
      return
    }
    const normalisedNameInstance = normaliseValidation(nameInstance)
    const {_type} = nameInstance
    const schema = validateRequired.getServiceSchema(_type)
    if (!schema || !schema.properties || !schema.properties.name || !schema.properties.name.processInput) {
      return
    }
    const required = isRequired(normalisedNameInstance, userData)
    normalisedNameInstance.$required = required
    if (required) {
      const composite = getComponentComposite(normalisedNameInstance)
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
            compositeErrors++
          }
        })
        if (compositeErrors === composite.length) {
          // add first composite field as field to focus
          addError('required', nameInstance, {compositeInput: composite[0]})
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

  const checkboxSchema = validateRequired.getServiceSchema('checkbox')
  const defaultCheckboxValue = checkboxSchema.properties.value.default

  for (const checkboxesInstance of checkboxesInstances) {
    const normalisedCheckboxesInstance = normaliseValidation(checkboxesInstance)
    // NB. this is a bug - checkboxes should not be required by default. Update specification accordingly
    const required = isRequired(normalisedCheckboxesInstance, userData)

    if (required) {
      const checkboxInstances = normalisedCheckboxesInstance.items.filter(checkbox => checkbox.name)

      const checked = checkboxInstances.some(checkbox => {
        const checkboxValue = getUserDataProperty(checkbox.name)
        const expectedCheckboxValue = checkbox.value === undefined ? defaultCheckboxValue : checkbox.value

        return checkboxValue === expectedCheckboxValue
      })

      if (!checked) {
        addError('required', checkboxesInstance)
      }
    }
  }

  return errors
}
validateRequired.getServiceSchema = getServiceSchema

const validateInstanceRequired = (nameInstance, userData) => {
  const doubleCheckInstance = deepClone(nameInstance)
  return validateRequired({components: [doubleCheckInstance]}, userData)
}

module.exports = {
  isRequired,
  validateRequired,
  validateInstanceRequired
}
