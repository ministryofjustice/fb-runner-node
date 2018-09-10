const jp = require('jsonpath')
const {default: produce} = require('immer')
const {getServiceSchema} = require('../../service-data/service-data')
const {evaluate} = require('../../evaluate-condition/evaluate-condition')

const components = require('../component/component')

const processInput = (pageInstance, userData, input) => {
  pageInstance = produce(pageInstance, draft => {
    const {setUserDataProperty, unsetUserDataProperty} = userData
    const nameInstances = jp.query(draft, '$..[?(@.name)]')
    nameInstances.forEach(nameInstance => {
      const {_type, name, $conditionalShow} = nameInstance
      if ($conditionalShow) {
        const conditionalShow = evaluate($conditionalShow, userData)
        if (!conditionalShow) {
          nameInstance.$skipValidation = true
          // TODO: consider whether the unsettingshould be automatic
          unsetUserDataProperty(name)
          return
        }
      }
      let componentController = components[_type] || {}

      // component has own method for processing input
      if (componentController.processInput) {
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
      if (componentController.getComposite) {
        composite = componentController.getComposite(nameInstance)
      }
      if (composite) {
        let compositeValues = {}
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
              compositeValues[compositeSuffix] = compositeValue
            } else {
              unsetUserDataProperty(compositeName)
            }
          }
        })
        // if (nameValueCompositeCheck === composite.length) {
        if (nameValueCompositeCheck) {
          let compositeValue = '<compositeValue>'
          // if (componentController.getCompositeValue) {
          //   compositeValue = componentController.getCompositeValue(nameInstance, compositeValues)
          // }
          setUserDataProperty(name, compositeValue)
          input[name] = compositeValue
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
