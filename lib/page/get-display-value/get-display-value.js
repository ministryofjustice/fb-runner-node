require('@ministryofjustice/module-alias/register-module')(module)

const bytes = require('bytes')

const {getInstanceController} = require('~/fb-runner-node/controller/controller')

const {
  getInstanceTitleSummary
} = require('~/fb-runner-node/service-data/service-data')

const {getRedactedValue} = require('~/fb-runner-node/page/update-control-names/update-control-names')

const {format} = require('~/fb-runner-node/format/format')

function getDisplayValue ({skipRedact = false}, userData, nameInstance) {
  const {_type, name, items} = nameInstance

  let answer

  const {
    getDisplayValue: getDisplayValueForInstanceController
  } = getInstanceController(nameInstance)

  /*
   *  TODO
   *  https://dsdmoj.atlassian.net/browse/FB-770
   *
   *  Only date components have a `getDisplayValue` method on the controller
   *
   *  This hodgepodge should be refactored such that component controllers deal with the
   *  component-specific presentation of values rather than this one function
   *  dealing with everything except dates
   */

  if (getDisplayValueForInstanceController) {
    answer = getDisplayValueForInstanceController(nameInstance, userData, skipRedact)
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
    if (_type === 'upload') {
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

  /*
   *  It's multiline if ... it says so, or it has multi lines
   */
  const multiline = nameInstance.multiline || /\n\n/.test(String(answer).trim())

  if (substitution || markdown || multiline) {
    answer = format(answer, {}, {substitution, markdown, multiline, lang: userData.contentLang})
    if (answer) {
      answer = answer
        .replace(/&amp;/g, '&')

      /*
       * TODO
       * https://dsdmoj.atlassian.net/browse/FB-770
       */
      if (_type === 'fileupload' || _type === 'upload' || _type === 'checkboxes') {
        answer = answer
          .replace(/<p>/g, '<p class="govuk-body">')
      }
    }
  }

  return answer
}

module.exports = getDisplayValue
