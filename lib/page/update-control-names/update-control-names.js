const jp = require('jsonpath')

const updateControlNames = (page, getUserDataProperty) => {
  const nameInstances = jp.query(page, '$..[?(@.name)]')
  nameInstances.forEach(nameInstance => {
    if (nameInstance.items) {
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
  return page
}

module.exports = updateControlNames
