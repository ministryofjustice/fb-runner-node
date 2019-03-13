const jp = require('jsonpath')
const {default: produce} = require('immer')

const {getServiceSchema} = require('../../service-data/service-data')
const {evaluateInput} = require('../../evaluate-condition/evaluate-condition')

const components = require('../component/component')

const updateControlNames = (pageInstance, userData) => {
  let updatedPageInstance = produce(pageInstance, draft => {
    const {getUserDataProperty} = userData
    const nameInstances = jp.query(draft, '$..[?(@.name)]')
    nameInstances.forEach(nameInstance => {
      if (nameInstance.disabled) {
        nameInstance.disabled = evaluateInput(nameInstance.disabled, userData.getUserData())
      }
      const getRequired = (instance, defaultValue = true) => {
        // TODO: fix checkbox specification
        if (instance._type === 'checkbox') {
          return true
        }
        if (instance._type === 'button') {
          return false
        }
        if (!instance.validation) {
          return defaultValue
        }
        let requiredCondition = instance.validation.required
        if (requiredCondition === undefined) {
          return defaultValue
        }
        return evaluateInput(requiredCondition, userData.getUserData())
      }
      const required = getRequired(nameInstance)
      const optionalString = required ? '' : ' (optional)'
      if (nameInstance.legend) {
        if (nameInstance.legend.html) {
          nameInstance.legend.html += optionalString
        } else {
          nameInstance.legend += optionalString
        }
      } else if (nameInstance.label) {
        if (nameInstance.label.html) {
          nameInstance.label.html += optionalString
        } else {
          nameInstance.label += optionalString
        }
      }
      if (userData.EDITMODE === 'edit') {
        return
      }

      const {_type} = nameInstance
      let composite
      const schema = getServiceSchema(_type)
      if (schema) {
        composite = schema.composite
        if (components[_type] && components[_type].getComposite) {
          composite = components[_type].getComposite(nameInstance)
        }
      }
      if (composite) {
        // do nothing
      } else if (nameInstance.items) {
        nameInstance.items.forEach(item => {
          if (item.value === getUserDataProperty(nameInstance.name)) {
            const chosen = item._type === 'option' ? 'selected' : 'checked'
            item[chosen] = true
          }
        })
      } else if (nameInstance.value) {
        if (nameInstance.value === getUserDataProperty(nameInstance.name)) {
          nameInstance.checked = true
        }
      } else {
        if (getUserDataProperty(nameInstance.name)) {
          nameInstance.value = getUserDataProperty(nameInstance.name)
        }
      }
    })
    return draft
  })
  return updatedPageInstance
}

module.exports = updateControlNames
