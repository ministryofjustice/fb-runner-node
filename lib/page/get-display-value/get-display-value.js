require('module-alias/register')

const bytes = require('bytes')

const {getInstanceController} = require('~/fb-runner-node/controller/controller')

const {
  getInstanceTitleSummary
} = require('~/fb-runner-node/service-data/service-data')

const {getRedactedValue} = require('~/fb-runner-node/page/update-control-names/update-control-names')

const {format} = require('~/fb-runner-node/format/format')

const getDisplayValue = ({skipRedact = false}, userData, nameInstance) => {
  const {_type, name, items} = nameInstance

  let answer

  const {
    getDisplayValue: getDisplayValueFromInstanceController
  } = getInstanceController(nameInstance)

  /**
   *  Only dates have a `getDisplayValue` method on the controller
   */
  if (getDisplayValueFromInstanceController) {
    answer = getDisplayValueFromInstanceController(nameInstance, userData, skipRedact)
  } else {
    if (name) {
      answer = getRedactedValue(nameInstance, userData, skipRedact, 'input')
    }
  }

  let substitution = false
  let markdown = false

  if (Array.isArray(items)) {
    if (_type === 'checkboxes') {
      answer = items
        .filter(({value = 'yes', name}) => value === userData.getUserDataInputProperty(name))
        .map(({_id, value}) => getInstanceTitleSummary(_id) || value)
    } else {
      const item = items.find(({value}) => value === answer)
      if (item) {
        answer = getInstanceTitleSummary(item._id)
        substitution = true
      }
    }
  }

  if (Array.isArray(answer)) {
    if (_type === 'fileupload') {
      answer = answer.map(({originalname, size}) => `${originalname} (${bytes(size)})`)
    }

    answer = answer.length ? answer.join('\n\n') : 'Not answered'
    substitution = true
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
      substitution = true
    }
  }

  const multiline = nameInstance.multiline || _type === 'fileupload' || _type === 'checkboxes'
  // TODO: check whether the lang property serve any purpose?
  if (substitution || markdown || multiline) {
    answer = format(answer, {}, {substitution, markdown, multiline, lang: userData.contentLang})
    if (answer) {
      answer = answer.replace(/&amp;/g, '&')
    }
  }

  return answer
}

module.exports = getDisplayValue
