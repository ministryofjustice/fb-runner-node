const moment = require('moment')

const {getServiceSchema} = require('../../../../service-data/service-data')

const DateController = {}

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

DateController.getCompositeValue = (instance, compositeValues) => {
  const valueParts = []
  if (compositeValues.year) {
    valueParts.push(compositeValues.year)
  }
  if (compositeValues.month) {
    compositeValues.month = `0${compositeValues.month}`.replace(/^0+(\d\d)$/, '$1')
    valueParts.push(compositeValues.month)
  }
  if (compositeValues.day) {
    compositeValues.day = `0${compositeValues.day}`.replace(/^0+(\d\d)$/, '$1')
    valueParts.push(compositeValues.day)
  }
  return valueParts.join('-')
}

DateController.validate = (instance, userData) => {
  let errors = []
  const invalidParts = {}
  const setCompositeErrors = () => {
    Object.keys(invalidParts).forEach(part => {
      const compositeName = `${instance.name}-${part}`
      errors.push({
        compositeName,
        error: true
      })
    })
  }
  const compositeParts = getCompositeParts(instance)
  const compositeValues = {}
  compositeParts.forEach(part => {
    const compositeName = `${instance.name}-${part}`
    const compositeValue = userData.getUserDataProperty(compositeName)
    compositeValues[part] = compositeValue
    if (compositeValue === undefined) {
      invalidParts[part] = true
    } else if (compositeValue.includes('-')) {
      invalidParts[part] = true
    } else if (compositeValue.includes('.')) {
      invalidParts[part] = true
    }
    const maxLength = part === 'year' ? 4 : 2
    const minLength = part === 'year' ? 4 : 1
    const minValue = part === 'year' ? 1800 : 1
    if (compositeValue) {
      if (compositeValue.length > maxLength) {
        invalidParts[part] = true
      } else if (compositeValue.length < minLength) {
        invalidParts[part] = true
      } else if (Number(compositeValue) < minValue) {
        invalidParts[part] = true
      }
    }
  })
  const errorCount = Object.keys(invalidParts).length
  if (errorCount === compositeParts.length) {
    setCompositeErrors()
    return errors
  }
  let validDate = !errorCount
  let isoDate = DateController.getCompositeValue(instance, compositeValues)
  if (validDate) {
    try {
      isoDate = moment(isoDate)
      validDate = isoDate.isValid()
    } catch (e) {
      validDate = false
    }
  }

  if (!validDate) {
    let errorType = 'date.invalid'
    if (!invalidParts.year && compositeParts.includes('year')) {
      const yearStr = `${compositeValues.year}-01-01`
      const validYear = moment(yearStr).isValid()
      if (!validYear || Number(compositeValues.year) < 1000) {
        invalidParts.year = true
      }
    }
    if (!invalidParts.month && compositeParts.includes('month')) {
      const monthStr = `2001-${compositeValues.month}-01`
      const validMonth = moment(monthStr).isValid()
      if (!validMonth || Number(compositeValues.month) < 1) {
        invalidParts.month = true
      }
    }
    if (!invalidParts.day && compositeParts.includes('day')) {
      const month = invalidParts.month ? '01' : compositeValues.month
      const dayStr = `2001-${month}-${compositeValues.day}`
      const validDay = moment(dayStr).isValid()
      if (!validDay || Number(compositeValues.day) < 1) {
        invalidParts.day = true
      }
    }

    setCompositeErrors()
    const invalidKeys = Object.keys(invalidParts)
    if (invalidKeys.length === 1) {
      errorType += `.${invalidKeys[0]}`
    }
    errors.push({
      errorType,
      instance: instance.name,
      error: {
        compositeInput: invalidKeys[0] // register field we should focus
      }
    })
  }

  if (!errors.length) {
    if (instance.validation) {
      const addValidationError = (errorType, targetValue) => {
        errors.push({
          errorType,
          instance: instance.name,
          error: {
            targetValue
          }
        })
      }
      const {dateBefore, dateAfter, dateWithinNext, dateWithinLast} = instance.validation
      if (dateBefore) {
        const isBefore = isoDate.isSameOrBefore(dateBefore)
        if (!isBefore) {
          const targetValue = DateController.getFormattedDate(dateBefore)
          addValidationError('date.invalid.before', targetValue)
        }
      }
      if (dateAfter) {
        const isAfter = isoDate.isSameOrAfter(dateAfter)
        if (!isAfter) {
          const targetValue = DateController.getFormattedDate(dateAfter)
          addValidationError('date.invalid.after', targetValue)
        }
      }
      if (dateWithinNext) {
        const withinNextDate = moment().add(dateWithinNext.amount, dateWithinNext.unit)
        const isWithinNext = isoDate.isSameOrBefore(withinNextDate)
        if (!isWithinNext) {
          const targetValue = `${dateWithinNext.amount} ${dateWithinNext.unit}${dateWithinNext.amount === 1 ? '' : 's'}`
          addValidationError('date.invalid.within.next', targetValue)
        }
      }
      if (dateWithinLast) {
        const withinLastDate = moment().subtract(dateWithinLast.amount, dateWithinLast.unit)
        const isWithinLast = isoDate.isSameOrAfter(withinLastDate)
        if (!isWithinLast) {
          const targetValue = `${dateWithinLast.amount} ${dateWithinLast.unit}${dateWithinLast.amount === 1 ? '' : 's'}`
          addValidationError('date.invalid.within.last', targetValue)
        }
      }
    }
  }

  return errors
}

DateController.getFormattedDate = (dateObj, dateFormat = ['day', 'month', 'year']) => {
  let defaultFormatStrings = {
    day: 'D',
    month: 'MMMM',
    year: 'Y'
  }
  if (Array.isArray(dateFormat)) {
    let defaultFormatParts = dateFormat.map(part => defaultFormatStrings[part])
    let defaultDelimiter = ' '
    let defaultFormat = defaultFormatParts.join(defaultDelimiter)
    dateFormat = defaultFormat
  }

  return moment(dateObj).format(dateFormat)
}

DateController.getDisplayValue = (instance, userData) => {
  const parts = getCompositeParts(instance)
  let {name} = instance
  if (!name.startsWith('COMPOSITE')) {
    name = `COMPOSITE.${name}`
  }

  const partValues = parts.map(part => {
    const value = userData.getUserDataProperty(`${name}-${part}`)
    if (value === undefined) {
      return
    }
    return {
      part,
      value
    }
  })
  if (partValues.includes(undefined)) {
    return 'Not completed'
  }

  const dateObj = new Date()
  dateObj.setHours(2)

  partValues.forEach((partValue, index) => {
    let {part, value} = partValue
    let dateValue = Number(value)
    if (part === 'day') {
      dateObj.setDate(dateValue)
    } else if (part === 'month') {
      dateObj.setMonth(dateValue - 1)
    } else if (part === 'year') {
      dateObj.setYear(dateValue)
    }
  })

  let dateFormat = instance.dateFormat || parts
  return DateController.getFormattedDate(dateObj, dateFormat)
}

module.exports = DateController
