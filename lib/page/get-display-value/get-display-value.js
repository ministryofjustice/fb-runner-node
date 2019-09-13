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
  if (nameInstance._type === 'checkboxes') {
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
      const nameItem = nameInstance.items.filter(item => item.value === answer)[0]
      answer = nameItem ? getInstanceTitleSummary(nameItem._id) : answer
      if (nameItem) {
        substitution = true
      }
    }
  }
  if (_type === 'fileupload') {
    if (Array.isArray(answer)) {
      answer = answer.map(a => {
        return `${a.originalname} (${bytes(a.size)})`
      }).join('\n\n')
      markdown = true
    }
  }

  const unansweredQuestion = !answer

  if (unansweredQuestion) {
    answer = 'Not answered'
  }

  if (Array.isArray(answer)) {
    answer = answer.join('\n\n')
    markdown = true
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
