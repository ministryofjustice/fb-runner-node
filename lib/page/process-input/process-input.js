const jp = require('jsonpath')
const {default: produce} = require('immer')
const {getServiceSchema} = require('../../service-data/service-data')

const components = require('../component/component')

const processInput = (pageInstance, userData, input) => {
  pageInstance = produce(pageInstance, draft => {
    const {setUserDataProperty, unsetUserDataProperty} = userData
    const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
    nameInstances.forEach(nameInstance => {
      const {_type, name} = nameInstance

      // component has own method for processing input
      if (components[_type] && components[_type].processInput) {
      // component has own method for processing input
      }

      const schema = getServiceSchema(_type)
      if (!schema || !schema.properties || !schema.properties.name) {
        return
      }
      const nameSchema = schema.properties.name
      if (!nameSchema.processInput) {
        return
      }

      let composite = schema.composite
      // if component has a getComposite method, call it
      if (components[_type] && components[_type].getComposite) {
        composite = components[_type].getComposite(nameInstance)
      }
      if (composite) {
        let nameValueCompositeCheck = 0
        composite.forEach(compositeSuffix => {
          const compositeName = `${name}-${compositeSuffix}`
          let compositeValue = input[compositeName]
          if (compositeValue !== undefined) {
            compositeValue = compositeValue.trim()
            if (compositeValue === '') {
              compositeValue = undefined
            }
            if (compositeValue !== undefined) {
              nameValueCompositeCheck += 1
              setUserDataProperty(compositeName, compositeValue)
            } else {
              unsetUserDataProperty(compositeName)
            }
          }
        })
        if (nameValueCompositeCheck === composite.length) {
          setUserDataProperty(name, '<compositeValue>')
        } else {
          unsetUserDataProperty(name)
        }
        return
      }

      let nameValue = input[name] // get(input, name)

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
  })
  return pageInstance
}

module.exports = processInput
