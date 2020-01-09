require('@ministryofjustice/module-alias/register-module')(module)

const bytes = require('bytes')

const CommonController = require('~/fb-runner-node/controller/component/common')

const {
  format
} = require('~/fb-runner-node/format/format')

function getUploadPage ({getBodyInput}) {
  const {
    uploadPage
  } = getBodyInput()

  return uploadPage
}

module.exports = class UploadController extends CommonController {
  async preFlight (componentInstance, userData, {_id}) {
    const bodyInput = userData.getBodyInput()

    if (Reflect.has(bodyInput, 'fieldName')) userData.setUserDataProperty('fieldName', Reflect.get(bodyInput, 'fieldName'))

    userData.setUserDataProperty('uploadPage', _id)

    userData.unsetUserDataProperty('removeUpload')
    userData.unsetUserDataProperty('upload')

    await userData.saveData()

    return componentInstance
  }

  async postValidation (componentInstance, userData, pageInstance) {
    userData.setUserDataProperty('uploadPage', getUploadPage(userData))

    await userData.saveData()

    return componentInstance
  }

  isAnswered ({name}, userData, scope) {
    const uploadValue = userData.getUserDataInputProperty(name) || []

    return !!uploadValue.length
  }

  getAnsweredDisplayValue ({name, ...instance}, userData, scope) {
    const uploadValue = userData.getUserDataInputProperty(name) || []

    const value = uploadValue.map(({originalname, size}) => `${originalname} (${bytes(size)})`).join('\n\n')

    return format(value, {}, {multiline: this.isMultiLine({...instance, name}, value), substitution: true, markdown: true, lang: userData.contentLang})
      .replace(/<p>/g, '<p class="govuk-body">')
  }
}
