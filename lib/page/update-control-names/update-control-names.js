const jp = require('jsonpath')
const {default: produce} = require('immer')

const {getServiceSchema} = require('../../service-data/service-data')
const {instanceError} = require('../validate-input/validate-input')
const redact = require('../../redact/redact')

const {getInstanceController} = require('../../controller/controller')

const getRedactedValue = (nameInstance, userData, skipRedaction) => {
  let value = userData.getUserDataProperty(nameInstance.name)
  if (!value || skipRedaction) {
    return value
  }
  if (nameInstance.redact && !nameInstance.error) {
    const hasError = instanceError(nameInstance, userData)

    const redacted = hasError ? undefined : nameInstance.redact
    if (redacted && value) {
      value = redact(value, redacted)
    }
  }
  return value
}

const updateControlNames = (pageInstance, userData) => {
  let updatedPageInstance = produce(pageInstance, draft => {
    const {getUserDataProperty} = userData
    const nameInstances = jp.query(draft, '$..[?(@.name)]')
    nameInstances.forEach(nameInstance => {
      if (nameInstance.disabled) {
        nameInstance.disabled = userData.evaluate(nameInstance.disabled, {
          page: pageInstance,
          instance: nameInstance
        })
      }
      const getRequired = (instance, defaultValue = true) => {
        // TODO: fix checkbox specification
        if (instance._type === 'checkbox') {
          return true
        }
        if (instance._type === 'button') {
          return false
        }
        if (!instance.validation) {
          return defaultValue
        }
        let requiredCondition = instance.validation.required
        if (requiredCondition === undefined) {
          return defaultValue
        }
        return userData.evaluate(requiredCondition, {
          instance
        })
      }
      const required = getRequired(nameInstance)
      if (!required) {
        let optionalString = ''
        if (nameInstance.optionalText !== undefined) {
          if (nameInstance.optionalText) {
            optionalString = `[% ${nameInstance._id}#optionalText %]`
          }
        } else {
          optionalString = '[% question.optional %]'
        }
        optionalString = ` ${optionalString}`
        if (nameInstance.legend) {
          if (nameInstance.legend.html) {
            nameInstance.legend.html += optionalString
          } else {
            nameInstance.legend += optionalString
          }
        } else if (nameInstance.label) {
          if (nameInstance.label.html) {
            nameInstance.label.html += optionalString
          } else {
            nameInstance.label += optionalString
          }
        }
      }
      if (userData.EDITMODE === 'edit') {
        return
      }

      const {_type} = nameInstance
      let composite
      const schema = getServiceSchema(_type)
      if (schema) {
        composite = schema.composite
        const componentController = getInstanceController(nameInstance)
        if (componentController.getComposite) {
          composite = componentController.getComposite(nameInstance)
        }
      }
      if (composite) {
        // do nothing
      } else if (nameInstance.items) {
        nameInstance.items.forEach(item => {
          if (item.value === getUserDataProperty(nameInstance.name)) {
            const chosen = item._type === 'option' ? 'selected' : 'checked'
            item[chosen] = true
          }
        })
      } else if (nameInstance.value) {
        if (nameInstance.value === getUserDataProperty(nameInstance.name)) {
          nameInstance.checked = true
        }
      } else {
        let value = getRedactedValue(nameInstance, userData, pageInstance.skipRedact)
        if (typeof value !== 'undefined') {
          nameInstance.value = value
        }
      }
    })

    // ensure checkboxes have name property
    jp.apply(draft, '$..[?(@._type === "checkboxes")]', value => {
      value.name = value.name || value._id
      return value
    })

    return draft
  })
  return updatedPageInstance
}

updateControlNames.getRedactedValue = getRedactedValue

module.exports = updateControlNames
