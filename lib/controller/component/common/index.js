require('@ministryofjustice/module-alias/register-module')(module)

const getRedactedDisplayValue = require('~/fb-runner-node/redact/redact')

const {
  format
} = require('~/fb-runner-node/format/format')

module.exports = class CommonController {
  isMultiLine ({ multiline = false }, value) {
    return multiline || /\n\n/.test(String(value).trim())
  }

  isAnswered ({ name }, userData, scope) {
    const value = userData.getUserDataProperty(name, undefined, scope)

    return !(value === undefined || value === null || String(value) === '')
  }

  isRedacted ({ redacted }) {
    return !!redacted
  }

  getDisplayValue (...args) {
    let displayValue

    if (this.isAnswered(...args)) {
      if (this.isRedacted(...args)) {
        displayValue = this.getRedactedDisplayValue(...args)
      } else {
        displayValue = this.getAnsweredDisplayValue(...args)
      }
    } else {
      displayValue = this.getNotAnsweredDisplayValue(...args)
    }

    return displayValue
  }

  getAnsweredDisplayValue ({ name, ...instance }, userData, scope) { // getAnsweredDisplayValue
    const value = userData.getUserDataProperty(name, undefined, scope)

    return format(value, {}, { multiline: this.isMultiLine({ ...instance, name }, value), lang: userData.contentLang })
  }

  getNotAnsweredDisplayValue () {
    return 'Not answered'
  }

  getRedactedDisplayValue ({ name, redact }, userData, scope) {
    const value = userData.getUserDataProperty(name, undefined, scope)

    return getRedactedDisplayValue(value, redact)
  }

  async preFlight (componentInstance) { return componentInstance }

  async setContents (componentInstance) { return componentInstance }

  async postValidation (componentInstance) { return componentInstance }

  async preUpdateContents (componentInstance) { return componentInstance }

  async preRender (componentInstance) { return componentInstance }
}
