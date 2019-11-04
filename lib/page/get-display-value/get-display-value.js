const bytes = require('bytes')

const {getInstanceController} = require('../../controller/controller')

const {
  getInstanceTitleSummary
} = require('../../service-data/service-data')

const {getRedactedValue} = require('../update-control-names/update-control-names')

const {format} = require('../../format/format')

const getDisplayValue = (pageInstance, userData, nameInstance) => {
  const {_type, name} = nameInstance

  let answer = name ? getRedactedValue(nameInstance, userData, pageInstance.skipRedact, 'input') : ''

  const componentController = getInstanceController(nameInstance)
  if (componentController.getDisplayValue) {
    answer = componentController.getDisplayValue(nameInstance, userData)
  }

  let substitution
  let markdown
  if (_type === 'checkboxes') {
    if (nameInstance.items) {
      const values = nameInstance.items.filter(item => {
        let itemValue = item.value
        if (itemValue === undefined) {
          itemValue = 'yes'
        }
        return itemValue === userData.getUserDataInputProperty(item.name, null)
      }).map(item => {
        return getInstanceTitleSummary(item._id) || item.value
      })
      if (values.length === 0) {
        values.push('None')
      }
      answer = values.join('\n\n')
      substitution = true
    }
  } else {
    if (nameInstance.items) {
      const nameItem = nameInstance.items.find(({value}) => value === answer)
      answer = nameItem ? getInstanceTitleSummary(nameItem._id) : answer
      if (nameItem) {
        substitution = true
      }
    }
  }

  if (_type === 'fileupload') {
    if (Array.isArray(answer)) {
      answer = answer.map(({originalname, size}) => `${originalname} (${bytes(size)})`).join('\n\n')
      markdown = true
    }
  }

  if (Array.isArray(answer)) {
    answer = answer.join('\n\n')
    markdown = true
  } else {
    /**
     *  Answers may have been coerced to a non-string data type so we can't expect
     *  truthiness to tell us whether the question has been answered. Instead,
     *  we have some explicit conditions
     *
     *  They are:
     *    - Guard against undefined or null
     *    - Coerce to a string and confirm that the string is not empty
     *
     *  Any other primitive is acceptable
     */
    if (answer === undefined || answer === null || String(answer) === '') {
      answer = 'Not answered'
    }
  }

  const multiline = nameInstance.multiline || _type === 'fileupload' || _type === 'checkboxes'
  // TODO: check whether the lang property serve any purpose?
  if (substitution || markdown || multiline) {
    answer = format(answer, {}, {substitution, multiline, lang: userData.contentLang})
    if (answer) {
      answer = answer.replace(/&amp;/g, '&')
    }
  }
  return answer
}

module.exports = getDisplayValue
