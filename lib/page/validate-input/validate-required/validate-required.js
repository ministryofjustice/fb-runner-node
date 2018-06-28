const jp = require('jsonpath')

const registerError = require('../../register-error/register-error')

const validateRequired = (nameInstances, page, siteData, getPath, evaluateInput) => {
  let hasErrors = false

  const normaliseValidation = (instance) => {
    instance.validation = instance.validation || {}
    instance.errors = instance.errors || {}
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
    return evaluateInput(requiredCondition)
  }

  // ensure name instances have a validation property
  nameInstances.forEach(normaliseValidation)

  // perform required check
  nameInstances.forEach(nameInstance => {
    const required = getRequired(nameInstance)
    if (required) {
      let nameValue = getPath(nameInstance.name)
      if (typeof nameValue === 'string') {
        nameValue = nameValue.trim()
        if (!nameValue) {
          nameValue = undefined
        }
      }
      if (nameValue === undefined) {
        hasErrors = registerError(siteData, page, nameInstance, 'required', null)
      }
    }
  })

  const checkboxGroupInstances = jp.query(page, '$..[?(@._type === "checkboxes")]')
  checkboxGroupInstances.forEach(normaliseValidation)
  checkboxGroupInstances.forEach(checkboxGroupInstance => {
    // NB. this is a bug - checkboxes should not be required by default. Update specification accordingly
    const required = getRequired(checkboxGroupInstance, false)
    if (required) {
      const checkboxInstanceNames = checkboxGroupInstance.items.map(checkbox => checkbox.name).filter(name => name)
      let checked = false
      checkboxInstanceNames.forEach(name => {
        if (getPath(name)) {
          checked = true
        }
      })
      if (!checked) {
        hasErrors = registerError(siteData, page, checkboxGroupInstance, 'required', null)
      }
    }
  })

  return hasErrors
}

module.exports = validateRequired
