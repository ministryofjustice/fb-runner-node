const jp = require('jsonpath')
const {default: produce} = require('immer')

const updateControlNames = (pageInstance, userData) => {
  let updatedPageInstance = produce(pageInstance, draft => {
    const {getUserDataProperty} = userData
    const nameInstances = jp.query(draft, '$..[?(@.name)]')
    nameInstances.forEach(nameInstance => {
      let composite
      if (nameInstance._type === 'date') {
        composite = ['day', 'month', 'year']
        // need to filter what is in the composite
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
