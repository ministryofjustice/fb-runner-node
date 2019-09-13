const {getInstanceController} = require('../../controller/controller')

const processControlComposite = (pageInstance, userData, nameInstance, options) => {
  const {
    composite
  } = options
  const componentController = getInstanceController(nameInstance)

  const input = userData.getBodyInput()
  const {setUserDataProperty, unsetUserDataProperty} = userData

  const instanceCompositeName = nameInstance.name
  const compositeValues = {}
  let nameValueCompositeCheck = 0
  composite.forEach(compositeSuffix => {
    const compositeName = `${instanceCompositeName}-${compositeSuffix}`
    let compositeValue = input[compositeName]
    if (compositeValue !== undefined) {
      compositeValue = compositeValue.trim()
      if (compositeValue === '') {
        compositeValue = undefined
      }
      if (compositeValue !== undefined) {
        nameValueCompositeCheck += 1
        setUserDataProperty(compositeName, compositeValue)
        compositeValues[compositeSuffix] = compositeValue
      } else {
        unsetUserDataProperty(compositeName)
      }
    }
  })

  let nameValue
  if (nameValueCompositeCheck) {
    // if (componentController.getCompositeValue) {
    nameValue = componentController.getCompositeValue(nameInstance, compositeValues)
    // }
  }
  return nameValue
}

module.exports = processControlComposite
