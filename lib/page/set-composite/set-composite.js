const jp = require('jsonpath')

const {getServiceSchema, getString} = require('../../service-data/service-data')

const {getInstanceController} = require('../../controller/controller')

const setComposite = (pageInstance, userData) => {
  const {getAllData, getUserDataProperty} = userData
  const allData = getAllData()
  const input = userData.getBodyInput()
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  nameInstances.forEach(nameInstance => {
    const {_type} = nameInstance
    let composite
    const schema = getServiceSchema(_type)
    if (schema) {
      composite = schema.composite
      const componentController = getInstanceController(nameInstance)
      if (componentController.getComposite) {
        composite = componentController.getComposite(nameInstance)
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
        const label = getString(compositeLabelKey, userData.contentLang)
        const classes = getString(`${compositeLabelKey}.classes`, userData.contentLang)
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

  return pageInstance
}

module.exports = setComposite
