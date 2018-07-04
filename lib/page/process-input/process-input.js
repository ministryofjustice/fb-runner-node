const jp = require('jsonpath')
const {default: produce} = require('immer')

const processInput = (pageInstance, userData, input) => {
  let processedPageInstance = produce(pageInstance, draft => {
    const {setUserDataProperty, unsetUserDataProperty} = userData
    const nameInstances = jp.query(draft, '$..[?(@.name)]')
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

    return draft
  })
  return processedPageInstance
}

module.exports = processInput
