const jp = require('jsonpath')
const {default: produce} = require('immer')

const {getServiceSchema, getString} = require('../../service-data/service-data')

const components = require('../component/component')

const setComposite = (pageInstance, userData) => {
  let updatedPageInstance = produce(pageInstance, draft => {
    const {getAllData, getUserDataProperty} = userData
    const allData = getAllData()
    const input = userData.getBodyInput()
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
        delete nameInstance.namePrefix // prevent clash with govuk-frontend macros
        nameInstance.$originalName = nameInstance.name
        nameInstance.name = `COMPOSITE.${nameInstance.name}`
        nameInstance.items = composite.map(name => {
          const compositeName = `${nameInstance.name}-${name}`
          let value = allData.input[compositeName]
          if (value === undefined) {
            value = input[compositeName]
          }
          if (value === undefined) {
            value = getUserDataProperty(compositeName) || ''
          }
          const compositeLabelKey = `${nameInstance._type}.${name}`
          const label = getString(compositeLabelKey)
          const classes = getString(`${compositeLabelKey}.classes`)
          return {
            instanceName: nameInstance.$originalName,
            compositeName,
            name: compositeName,
            label,
            classes,
            value
          }
        })
      }
    })
    return draft
  })
  return updatedPageInstance
}

module.exports = setComposite
