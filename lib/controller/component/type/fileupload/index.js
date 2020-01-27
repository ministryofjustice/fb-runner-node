require('@ministryofjustice/module-alias/register-module')(module)

const bytes = require('bytes')

const CommonController = require('~/fb-runner-node/controller/component/common')

const {
  format
} = require('~/fb-runner-node/format/format')

module.exports = class FileUploadController extends CommonController {
  isAnswered ({ name }, userData, scope) {
    const uploadValue = userData.getUserDataInputProperty(name) || []

    return !!uploadValue.length
  }

  getAnsweredDisplayValue ({ name, ...instance }, userData, scope) {
    const uploadValue = userData.getUserDataInputProperty(name) || []

    const value = uploadValue.map(({ originalname, size }) => `${originalname} (${bytes(size)})`).join('\n\n')

    return format(value, {}, { multiline: this.isMultiLine({ ...instance, name }, value), substitution: true, markdown: true, lang: userData.contentLang })
      .replace(/<p>/g, '<p class="govuk-body">')
  }
}
