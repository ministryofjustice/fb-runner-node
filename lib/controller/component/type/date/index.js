require('@ministryofjustice/module-alias/register-module')(module)

const moment = require('moment')

const CommonController = require('~/fb-runner-node/controller/component/common')

const {
  isRequired
} = require('~/fb-runner-node/page/validate-input/validate-input')

const {
  getServiceSchema
} = require('~/fb-runner-node/service-data/service-data')

let defaultComposite
let defaultDateType

let dateSchema

function getCompositeParts (instance) {
  if (!dateSchema) {
    ({
      composite: defaultComposite,
      properties: {
        dateType: {
          default: defaultDateType
        }
      }
    } = getServiceSchema('date'))
  }

  const {
    dateType = defaultDateType
  } = instance

  return defaultComposite.filter((item) => dateType.includes(item))
}

module.exports = class DateController extends CommonController {
  getComposite (instance) {
    return getCompositeParts(instance)
  }

  getCompositeValue (instance, compositeValues) {
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

  validate (instance, userData) {
    const errors = []
    let invalidParts = {}
    function setCompositeErrors () {
      Object.keys(invalidParts).forEach(part => {
        const compositeName = `${instance.name}-${part}`
        errors.push({
          compositeName,
          error: true
        })
      })
    }

    function addValidationError (errorType, targetValue) {
      compositeParts.forEach(part => {
        invalidParts[part] = true
      })
      setCompositeErrors()
      errors.push({
        errorType,
        instance: instance.name,
        error: {
          targetValue,
          compositeInput: compositeParts[0]
        }
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

    const required = isRequired(instance, userData)
    if (!required) {
      const valuesEntered = Object.values(compositeValues).filter(val => val).length > 0
      if (!valuesEntered) {
        return errors
      }
    }

    let validDate = !Object.keys(invalidParts).length

    let isoDate = this.getCompositeValue(instance, compositeValues)
    if (validDate) {
      try {
        isoDate = moment(isoDate)
        validDate = isoDate.isValid()
      } catch (e) {
        validDate = false
      }
    }

    const missingParts = compositeParts
      .filter(part => !compositeValues[part])

    // https://design-system.service.gov.uk/components/date-input/
    if (!validDate || missingParts.length) {
      let errorType

      if (missingParts.length) {
        const required = missingParts.length === compositeParts.length
        invalidParts = {}
        // required - If nothing is entered
        // date.missing - If an incomplete date is entered and you know what is missing
        errorType = required ? 'required' : 'date.missing'
        missingParts.forEach(part => {
          invalidParts[part] = true
          if (!required) {
            errorType += `.${part}`
          }
        })
      } else {
      // date.invalid - If the date entered is not a real one
        errorType = 'date.invalid'
        invalidParts = {} // so compositeParts order is respected
        compositeParts.forEach(part => {
          invalidParts[part] = true
        })
      }
      setCompositeErrors()
      const invalidKeys = Object.keys(invalidParts)

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
        const {dateBefore, dateAfter, dateWithinNext, dateWithinLast} = instance.validation
        if (dateBefore) {
          const isBefore = isoDate.isSameOrBefore(dateBefore)
          if (!isBefore) {
            const targetValue = this.getFormattedDate(dateBefore)
            addValidationError('date.invalid.before', targetValue)
          }
        }
        if (dateAfter) {
          const isAfter = isoDate.isSameOrAfter(dateAfter)
          if (!isAfter) {
            const targetValue = this.getFormattedDate(dateAfter)
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

  getFormattedDate (dateObj, dateFormat = ['day', 'month', 'year']) {
    const defaultFormatStrings = {
      day: 'D',
      month: 'MMMM',
      year: 'Y'
    }
    if (Array.isArray(dateFormat)) {
      const defaultFormatParts = dateFormat.map(part => defaultFormatStrings[part])
      const defaultDelimiter = ' '
      const defaultFormat = defaultFormatParts.join(defaultDelimiter)
      dateFormat = defaultFormat
    }

    return moment(dateObj).format(dateFormat)
  }

  getDisplayValue (instance, userData) {
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
      return 'Not answered'
    }

    const dateObj = new Date()
    dateObj.setHours(2)

    partValues.forEach((partValue, index) => {
      const {part, value} = partValue
      const dateValue = Number(value)
      if (part === 'day') {
        dateObj.setDate(dateValue)
      } else if (part === 'month') {
        dateObj.setMonth(dateValue - 1)
      } else if (part === 'year') {
        dateObj.setYear(dateValue)
      }
    })

    const dateFormat = instance.dateFormat || parts

    return this.getFormattedDate(dateObj, dateFormat)
  }
}
