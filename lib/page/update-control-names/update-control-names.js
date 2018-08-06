const jp = require('jsonpath')
const {default: produce} = require('immer')

const {getServiceSchema} = require('../../service-data/service-data')

const components = require('../component/component')

const updateControlNames = (pageInstance, userData) => {
  let updatedPageInstance = produce(pageInstance, draft => {
    const {getUserDataProperty} = userData
    const nameInstances = jp.query(draft, '$..[?(@.name)]')
    nameInstances.forEach(nameInstance => {
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
        nameInstance.items = composite.map(name => {
          const compositeName = `${nameInstance.name}-${name}`
          return {
            name,
            value: getUserDataProperty(compositeName)
          }
        })
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
