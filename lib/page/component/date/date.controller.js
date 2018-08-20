const DateController = {}

const {getServiceSchema} = require('../../../service-data/service-data')
let compositeDefault
let dateTypeDefault

const getCompositeParts = (instance) => {
  if (!compositeDefault) {
    const DateSchema = getServiceSchema('date')
    compositeDefault = DateSchema.composite
    dateTypeDefault = DateSchema.properties.dateType.default
  }
  let composite = compositeDefault.slice()
  const dateType = instance.dateType || dateTypeDefault
  composite = composite.filter(item => dateType.includes(item))
  return composite
}

DateController.getComposite = (instance) => {
  return getCompositeParts(instance)
}

DateController.getDisplayValue = (instance, userData) => {
  const parts = getCompositeParts(instance)
    .map(part => userData.getUserDataProperty(`${instance.name}-${part}`))
  if (parts.includes(undefined)) {
    return 'Not completed'
  }
  return parts.join('/')
}

module.exports = DateController
