const jp = require('jsonpath')

const {instanceHasError} = require('../validate-input/validate-input')
const redact = require('../../redact/redact')
const getComponentComposite = require('../../controller/component/get-composite')

const getRedactedValue = (nameInstance, userData, skipRedaction, scope) => {
  let value = userData.getUserDataProperty(nameInstance.name, undefined, scope)
  if (!value || skipRedaction) {
    return value
  }
  if (nameInstance.redact && !nameInstance.error) {
    const hasError = instanceHasError(nameInstance, userData)

    const redacted = hasError ? undefined : nameInstance.redact
    if (redacted && value) {
      value = redact(value, redacted)
    }
  }
  return value
}

const updateControlNames = (pageInstance, userData) => {
  const {getUserDataProperty} = userData
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
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
      const requiredCondition = instance.validation.required
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

    const composite = getComponentComposite(nameInstance)
    if (composite) {
      // do nothing
    } else if (nameInstance.items) {
      const propValue = getUserDataProperty(nameInstance.name)
      nameInstance.items.forEach(item => {
        const value = item.value || item.text
        if (value === propValue) {
          const chosen = item._type === 'option' ? 'selected' : 'checked'
          item[chosen] = true
        }
      })
    } else if (nameInstance.value) {
      if (nameInstance.value === getUserDataProperty(nameInstance.name)) {
        nameInstance.checked = true
      }
    } else {
      const value = getRedactedValue(nameInstance, userData, pageInstance.skipRedact)
      if (typeof value !== 'undefined') {
        nameInstance.value = value
      }
    }
  })

  // ensure checkboxes have name property
  jp.apply(pageInstance, '$..[?(@._type === "checkboxes")]', value => {
    value.name = value.name || value._id
    return value
  })

  return pageInstance
}

updateControlNames.getRedactedValue = getRedactedValue

module.exports = updateControlNames
