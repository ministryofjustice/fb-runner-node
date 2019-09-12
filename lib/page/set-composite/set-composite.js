const jp = require('jsonpath')

const {getString} = require('../../service-data/service-data')
const getComponentComposite = require('../../controller/component/get-composite')

const setComposite = (pageInstance, userData) => {
  const {getAllData, getUserDataProperty} = userData
  const allData = getAllData()
  const input = userData.getBodyInput()
  const nameInstances = jp.query(pageInstance, '$..[?(@.name)]')
  nameInstances.forEach(nameInstance => {
    const composite = getComponentComposite(nameInstance)
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
