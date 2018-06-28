const jp = require('jsonpath')
const jsonschema = require('jsonschema')
const validator = new jsonschema.Validator()

const {format} = require('../format/format')
// const {evaluate} = require('../evaluate-condition')

const validatePage = (page, siteData, getPath, evaluateInput) => {
  const nameInstances = jp.query(page, '$..[?(@.name)]')

  let hasErrors = false

  const registerError = (instance, errorType, error) => {
    if (error) {
      if (errorType === 'minimum' && error.schema.exclusiveMinimum) {
        errorType = 'exclusiveMinimum'
      } else if (errorType === 'maximum' && error.schema.exclusiveMaximum) {
        errorType = 'exclusiveMaximum'
      }
    }

    // Grab the error strings
    const errorStrings = siteData.errorStrings
    const errorHeaderStrings = siteData.errorHeaderStrings

    const instanceErrorStrings = instance.errors[errorType] || {}
    let {inline, summary} = instanceErrorStrings
    // TODO: handle composite errors
    // TODO: implement page header errors
    const args = Object.assign({control: instance.label || instance.legend}, instance.validation)
    let pageError = summary || errorHeaderStrings[`${errorType}.${instance._type}`] || errorHeaderStrings[errorType] || errorType
    pageError = format(pageError, args)
    page.errorList = page.errorList || []
    // TODO: make the href id robust - will fail for repeatable items on page
    page.errorList.push({
      html: pageError,
      href: `#${instance.id || instance._id}`
    })

    let instanceError = inline || errorStrings[`${errorType}.${instance._type}`] || errorStrings[errorType] || errorType
    instanceError = format(`${instanceError}`, args)
    instance.error = instanceError

    hasErrors = true
  }

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
        registerError(nameInstance, 'required')
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
        registerError(checkboxGroupInstance, 'required')
      }
    }
  })

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
      registerError(nameInstance, validationError.name, validationError)
    }
  })

  return hasErrors
}

module.exports = validatePage
