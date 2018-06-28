const jp = require('jsonpath')

const updateControlNames = (page, getPath) => {
  const nameInstances = jp.query(page, '$..[?(@.name)]')
  nameInstances.forEach(nameInstance => {
    if (nameInstance.items) {
      nameInstance.items.forEach(item => {
        if (item.value === getPath(nameInstance.name)) {
          const chosen = item._type === 'option' ? 'selected' : 'checked'
          item[chosen] = true
        }
      })
    } else if (nameInstance.value) {
      if (nameInstance.value === getPath(nameInstance.name)) {
        nameInstance.checked = true
      }
    } else {
      if (getPath(nameInstance.name)) {
        nameInstance.value = getPath(nameInstance.name)
      }
    }
  })
  return page
}

module.exports = updateControlNames
