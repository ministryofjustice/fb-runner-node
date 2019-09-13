const getDisplayValue = require('../get-display-value/get-display-value')

const updateControlDisplayValue = (pageInstance, userData, nameInstance, options) => {
  const {
    controlName,
    nameValue
  } = options
  const {
    setUserDataProperty,
    unsetUserDataProperty,
    getScope
  } = userData

  const scope = getScope()
  const displayScope = scope === undefined || scope === 'input'
  if (!displayScope) {
    return
  }

  if (nameValue !== undefined) {
    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
    setUserDataProperty(controlName, displayValue, 'display')
  } else {
    unsetUserDataProperty(controlName, 'display')
  }
}

module.exports = updateControlDisplayValue
