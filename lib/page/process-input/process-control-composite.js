require('@ministryofjustice/module-alias/register-module')(module)

const getComponentController = require('~/fb-runner-node/controller/component/get-controller')

module.exports = function processControlComposite (pageInstance, userData, nameInstance, options) {
  const {
    composite
  } = options

  const controller = getComponentController(nameInstance)

  const bodyInput = userData.getBodyInput()
  const {
    setUserDataProperty,
    unsetUserDataProperty
  } = userData

  const {
    name
  } = nameInstance

  const compositeValues = composite.reduce((accumulator, suffix) => {
    const compositeName = `${name}-${suffix}`
    const compositeValue = (bodyInput[compositeName] || '').trim()
    if (compositeValue) {
      setUserDataProperty(compositeName, compositeValue)
      return {...accumulator, [suffix]: compositeValue}
    } else {
      unsetUserDataProperty(compositeName)
      return accumulator
    }
  }, {})

  return controller.getCompositeValue(nameInstance, compositeValues)
}
