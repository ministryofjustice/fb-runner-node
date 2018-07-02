const jp = require('jsonpath')

const processInput = (pageInstance, userData, input) => {
  const {setUserDataProperty, unsetUserDataProperty} = userData
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  const names = nameInstances.map(nameInstance => nameInstance.name)
  names.forEach(name => {
    // TODO: handle composite values
    const nameValue = input[name]
    if (nameValue !== undefined) {
      setUserDataProperty(name, nameValue)
    } else {
      unsetUserDataProperty(name)
    }
  })

  return pageInstance
}

module.exports = processInput
