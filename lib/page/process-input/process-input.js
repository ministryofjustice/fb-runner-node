const jp = require('jsonpath')
const {FBError} = require('@ministryofjustice/fb-utils-node')
const {getServiceSchema} = require('../../service-data/service-data')
const redact = require('../../redact/redact')
const {getInstanceController} = require('../../controller/controller')
class FBProcessInputError extends FBError {}

const {PLATFORM_ENV} = require('../../constants/constants')

const getDisplayValue = require('../get-display-value/get-display-value')

const processInput = (pageInstance, userData) => {
  const logger = userData.logger
  const input = userData.getBodyInput()

  const {getUserDataProperty, setUserDataProperty, unsetUserDataProperty} = userData
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  nameInstances.forEach(nameInstance => {
    const {_type, name, $conditionalShow} = nameInstance
    if (_type === 'fileupload') {
      // don't process fileuploads
      return
    }
    // NB. this mirrors the same check in page.summary.controller
    if ($conditionalShow) {
      const conditionalShow = userData.evaluate($conditionalShow, {
        page: pageInstance,
        instance: nameInstance
      })
      if (!conditionalShow) {
        nameInstance.$skipValidation = true
        // TODO: consider whether the unsettingshould be automatic
        unsetUserDataProperty(name)
        return
      }
    }
    const componentController = getInstanceController(nameInstance)

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
      const originalName = nameInstance.$originalName
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
      // if (nameValueCompositeCheck === composite.length) {
      if (nameValueCompositeCheck) {
        let compositeValue = '<compositeValue>'
        if (componentController.getCompositeValue) {
          compositeValue = componentController.getCompositeValue(nameInstance, compositeValues)
        }
        setUserDataProperty(originalName, compositeValue)
        input[originalName] = compositeValue
      } else {
        unsetUserDataProperty(originalName)
      }
      return
    }

    let nameValue = input[name] // get(input, name)

    if (!nameInstance.acceptsEmptyString) {
      if (nameInstance._type === 'fileupload') {
        if (!nameValue) {
          nameValue = undefined
        } else {
          if (nameInstance.multiple) {
            if (typeof nameValue === 'string') {
              nameValue = [nameValue]
            }
          }
        }
      } else {
        if (nameValue) {
          if (Array.isArray(nameValue)) {
            logger.error({name}, 'Input name is not unique for the request')
            let renderError
            if (!PLATFORM_ENV) {
              renderError = {
                heading: `Input name ${name} is not unique`,
                lede: 'The form will not work correctly unless you fix this problem'
              }
            }
            throw new FBProcessInputError(`Input name ${name} is not unique`, {
              error: {
                code: 'EDUPLICATEINPUTNAME',
                renderError
              }
            })
          }
          nameValue = nameValue.trim()
        }
        if (nameValue === '') {
          nameValue = undefined
        }
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
      let skipSetValue
      if (nameInstance.redact) {
        const currentValue = getUserDataProperty(name)
        const redactedValue = redact(currentValue, nameInstance.redact)
        if (nameValue === redactedValue) {
          skipSetValue = true
        }
      }
      if (!skipSetValue) {
        setUserDataProperty(name, nameValue)
      }
    } else {
      unsetUserDataProperty(name)
    }

    const hasValue = getUserDataProperty(name)
    if (hasValue !== undefined) {
      const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
      setUserDataProperty(name, displayValue, 'display')
    } else {
      unsetUserDataProperty(name, 'display')
    }
  })

  return pageInstance
}

module.exports = processInput
