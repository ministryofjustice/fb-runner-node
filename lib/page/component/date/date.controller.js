const DateController = {}

const {getServiceSchema} = require('../../../service-data/service-data')
let compositeDefault
let dateTypeDefault

DateController.getComposite = (instance) => {
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

module.exports = DateController
