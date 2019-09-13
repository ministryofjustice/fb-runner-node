const redact = require('../../redact/redact')

const updateControlValue = (pageInstance, userData, nameInstance, options) => {
  const {
    controlName,
    nameValue,
    composite
  } = options
  const {
    getUserDataProperty,
    setUserDataProperty,
    unsetUserDataProperty
  } = userData

  if (nameValue !== undefined) {
    let skipSetValue
    if (nameInstance.redact) {
      const currentValue = getUserDataProperty(controlName)
      const redactedValue = redact(currentValue, nameInstance.redact)
      if (nameValue === redactedValue) {
        skipSetValue = true
      }
    }
    if (!skipSetValue) {
      setUserDataProperty(controlName, nameValue)
    }
  } else {
    unsetUserDataProperty(controlName)
    if (composite) {
      composite.forEach(compValue => {
        unsetUserDataProperty(`${nameInstance.name}-${compValue}`)
      })
    }
  }
}

module.exports = updateControlValue
