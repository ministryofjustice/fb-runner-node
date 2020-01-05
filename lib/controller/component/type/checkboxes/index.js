require('@ministryofjustice/module-alias/register-module')(module)

const CommonController = require('~/fb-runner-node/controller/component/common')

const {
  getInstanceTitleSummary
} = require('~/fb-runner-node/service-data/service-data')

const {
  format
} = require('~/fb-runner-node/format/format')

module.exports = class CheckboxesController extends CommonController {
  isAnswered ({items}, userData) {
    const value = items
      .filter(({value = 'yes', name}) => value === userData.getUserDataInputProperty(name))
      .map(({_id, value}) => getInstanceTitleSummary(_id) || value)

    return !!value.length
  }

  isAnsweredItem ({_id, value: checkboxValue}, userData) {
    const value = getInstanceTitleSummary(_id) || checkboxValue

    return !!value.length
  }

  isRedactedItem (...args) { return this.isRedacted(...args) }

  getAnsweredDisplayValue ({items, ...instance}, userData) {
    const value = items
      .filter(({value = 'yes', name}) => value === userData.getUserDataInputProperty(name))
      .map(({_id, value}) => getInstanceTitleSummary(_id) || value).join('\n\n')

    return format(value, {}, {multiline: this.isMultiLine({...instance, items}, value), substitution: true, markdown: true, lang: userData.contentLang})
      .replace(/<p>/g, '<p class="govuk-body">')
  }

  getAnsweredDisplayValueForItem ({_id, value: checkboxValue}, userData) {
    const value = getInstanceTitleSummary(_id) || checkboxValue

    return format(value, {}, {multiline: false, substitution: true, markdown: true, lang: userData.contentLang})
  }

  getRedactedDisplayValueForItem (...args) { return this.getRedactedDisplayValue(...args) }

  getDisplayValueForItem (...args) {
    let displayValue

    if (this.isAnsweredItem(...args)) {
      if (this.isRedactedItem(...args)) {
        displayValue = this.getRedactedDisplayValueForItem(...args)
      } else {
        displayValue = this.getAnsweredDisplayValueForItem(...args)
      }
    } else {
      displayValue = this.getNotAnsweredDisplayValue(...args)
    }

    return displayValue
  }
}
