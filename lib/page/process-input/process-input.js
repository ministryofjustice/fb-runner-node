const jp = require('jsonpath')
const {getServiceSchema} = require('../../service-data/service-data')

const processInput = (pageInstance, userData, input) => {
  const {setUserDataProperty, unsetUserDataProperty} = userData
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  nameInstances.forEach(nameInstance => {
    const {_type, name} = nameInstance
    const schema = getServiceSchema(_type)
    if (!schema || !schema.properties || !schema.properties.name) {
      return
    }
    const nameSchema = schema.properties.name
    if (!nameSchema.processInput) {
      return
    }

    let nameValue = input[name]
    if (!nameInstance.acceptsEmptyString) {
      if (nameValue) {
        nameValue = nameValue.trim()
      }
      if (nameValue === '') {
        nameValue = undefined
      }
    }
    if (nameSchema.inputType === 'number') {
      const originalNumberValue = nameValue
      nameValue = Number(nameValue)
      if (isNaN(nameValue)) {
        nameValue = originalNumberValue
      }
    }
    // TODO: handle composite values
    if (nameValue !== undefined) {
      setUserDataProperty(name, nameValue)
    } else {
      unsetUserDataProperty(name)
    }
  })

  return pageInstance
}

module.exports = processInput
