const moment = require('moment')

const DateController = {}

const {getServiceSchema} = require('../../../service-data/service-data')
let compositeDefault
let dateTypeDefault

let DateSchema

const getCompositeParts = (instance) => {
  if (!compositeDefault) {
    DateSchema = DateSchema || getServiceSchema('date')
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

  const partValues = parts.map(part => userData.getUserDataProperty(`${instance.name}-${part}`))
  if (partValues.includes(undefined)) {
    return 'Not completed'
  }
  let defaultFormatStrings = {
    day: 'D',
    month: 'MMMM',
    year: 'Y'
  }
  let defaultDelimiter = ' '
  // 'M', '/'
  let defaultFormatParts = parts.map(part => defaultFormatStrings[part])
  let defaultFormat = defaultFormatParts.join(defaultDelimiter)

  const dateObj = new Date()
  dateObj.setHours(2)

  parts.forEach((part, index) => {
    let dateValue = Number(partValues[index])
    if (part === 'day') {
      dateObj.setDate(dateValue)
    } else if (part === 'month') {
      dateObj.setMonth(dateValue - 1)
    } else if (part === 'year') {
      dateObj.setYear(dateValue)
    }
  })

  let dateFormat = instance.dateFormat || defaultFormat

  return moment(dateObj).format(dateFormat)
}

module.exports = DateController
