require('@ministryofjustice/module-alias/register-module')(module)

const debug = require('debug')
const bytes = require('bytes')

const CommonController = require('~/fb-runner-node/controller/component/common')

const {
  format
} = require('~/fb-runner-node/format/format')

const log = debug('runner:component:upload')

function getUploadPage ({ getBodyInput }) {
  const {
    'upload-component-page-id': _id
  } = getBodyInput()

  log({ _id })

  return _id
}

const {
  clearComponentFiles,
  hasComponentAcceptedAnyFiles,
  getComponentAcceptedFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

module.exports = class UploadController extends CommonController {
  async preFlight (componentInstance, userData, pageInstance, POST) {
    const bodyInput = userData.getBodyInput()

    if (!POST) clearComponentFiles(componentInstance, userData)

    if (Reflect.has(bodyInput, 'upload-component-field-name')) userData.setUserDataProperty('upload-component-field-name', Reflect.get(bodyInput, 'upload-component-field-name'))

    const {
      _id
    } = pageInstance

    log({ _id })

    userData.setUserDataProperty('upload-component-page-id', _id)

    userData.unsetUserDataProperty('upload-component-remove-id')
    userData.unsetUserDataProperty('upload-component-accept-id')

    await userData.saveData()

    return componentInstance
  }

  async postValidation (componentInstance, userData, pageInstance) {
    userData.setUserDataProperty('upload-component-page-id', getUploadPage(userData))

    await userData.saveData()

    return componentInstance
  }

  isAnswered (...args) {
    return hasComponentAcceptedAnyFiles(...args)
  }

  getAnsweredDisplayValue (component, userData, scope) {
    const value = getComponentAcceptedFiles(component, userData).map(({ originalname, size }) => `${originalname} (${bytes(size)})`).join('\n\n')

    return format(value, {}, { multiline: this.isMultiLine(component, value), substitution: true, markdown: true, lang: userData.contentLang })
      .replace(/<p>/g, '<p class="govuk-body">')
  }
}
