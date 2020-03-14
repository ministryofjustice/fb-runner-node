require('@ministryofjustice/module-alias/register-module')(module)

const CommonController = require('~/fb-runner-node/controller/page/common')

const debug = require('debug')
const bytes = require('bytes')

const {
  getInstance,
  getString
} = require('~/fb-runner-node/service-data/service-data')

const {
  getRedirectForNextPage,
  getRedirectFromPageToPage
} = require('~/fb-runner-node/page/page')

const {
  getUrl
} = require('~/fb-runner-node/route/route')

const {
  getComponents,
  getComponentMaxFiles,
  getComponentMinFiles,
  clearComponentFiles,
  hasComponentAcceptedMaxFiles,
  hasComponentAcceptedMinFiles,
  hasComponentsAcceptedMaxFiles,
  hasComponentsAcceptedMinFiles,
  removeFromComponentAcceptedFiles,
  hasComponentAcceptedFileByUUID,
  getComponentAcceptedFileByUUID
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  getComponentName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  format
} = require('~/fb-runner-node/format/format')

const log = debug('runner:page:upload-summary')

function createRadios ({ contentLang: lang }, count = 0) {
  const values = { count }
  const params = { lang }

  return {
    _id: 'page.uploadSummary.radios',
    _type: 'radios',
    name: 'upload-component-decision',
    legend: format(
      getString('uploadSummary.radios.legend', lang),
      values,
      params
    ),
    items: [
      {
        _id: 'page.uploadSummary.radios-confirm',
        _type: 'radio',
        label: format(
          getString('uploadSummary.radios.confirmAnother', lang),
          values,
          params
        ),
        value: 'confirm'
      },
      {
        _id: 'page.uploadSummary.radios-decline',
        _type: 'radio',
        label: format(
          getString('uploadSummary.radios.declineAnother', lang),
          values,
          params
        ),
        value: 'decline'
      }
    ],
    validation: {
      type: 'string'
    }
  }
}

module.exports = class UploadSummaryController extends CommonController {
  hasRemoveUpload ({ getBodyInput }) { return Reflect.has(getBodyInput(), 'upload-component-remove-id') }

  getRemoveUpload ({ getBodyInput }) { return Reflect.get(getBodyInput(), 'upload-component-remove-id') }

  confirmAnother ({ getBodyInput }) {
    const {
      'upload-component-decision': decision
    } = getBodyInput()

    log(decision, decision === 'confirm')

    return decision === 'confirm'
  }

  declineAnother ({ getBodyInput }) {
    const {
      'upload-component-decision': decision
    } = getBodyInput()

    log(decision, decision === 'decline')

    return decision === 'decline'
  }

  /*
   *  POST
   */
  async resolveRouteForRemoveUpload (summaryPageInstance, userData) {
    try {
      const {
        'upload-component-page-id': pageId
      } = userData.getBodyInput()

      const controlPageInstance = getInstance(pageId)

      return hasComponentsAcceptedMinFiles(controlPageInstance, userData)
        ? summaryPageInstance
        : controlPageInstance
    } catch (e) {
      return summaryPageInstance
    }
  }

  /*
   *  POST
   */
  async resolveRoute (pageInstance, userData) {
    try {
      const {
        'upload-component-page-id': pageId
      } = userData.getBodyInput()

      if (pageId) {
        const {
          'upload-component-decision': decision
        } = userData.getBodyInput()

        if (decision === 'confirm') {
          getComponents(getInstance(pageId))
            .forEach((component) => {
              clearComponentFiles(component, userData)
            })

          return getRedirectFromPageToPage(pageInstance, getInstance(pageId), userData)
        } else {
          const {
            'upload-component-accepted': accepted
          } = userData.getUserData()

          getComponents(getInstance(pageId))
            .forEach((component) => {
              const { name } = component

              userData.setUserDataProperty(name, accepted
                .filter(({ fieldName }) => getComponentName(fieldName) === name)
                .map(({ fieldName, fieldname = fieldName, ...file }) => ({ ...file, fieldname })))

              clearComponentFiles(component, userData)
            })

          await userData.saveData()
        }
      }

      return getRedirectForNextPage(pageInstance, userData)
    } catch (e) {
      return pageInstance
    }
  }

  /*
   *  GET and POST
   */
  async preFlight (pageInstance, userData) {
    if (Reflect.has(userData.getUserData(), 'upload-component-accepted')) {
      userData.unsetUserDataProperty('upload-component-decision')

      await userData.saveData()
    } else {
      const pageId = userData.getUserDataProperty('upload-component-page-id')

      pageInstance.redirect = getUrl(pageId, {}, userData.contentLang)
    }

    return pageInstance
  }

  /*
   *  GET and POST
   */
  async setContents (pageInstance, userData) {
    const {
      'upload-component-page-id': pageId,
      'upload-component-accepted': acceptedList = []
    } = userData.getUserData()

    if (pageId) {
      const {
        components = []
      } = pageInstance

      const {
        contentLang: lang
      } = userData

      const uploadPageInstance = getInstance(pageId)
      const uploadPageControls = getComponents(uploadPageInstance)

      if (hasComponentsAcceptedMinFiles(uploadPageInstance, userData)) {
        /*
         *  One upload list
         */
        const uploadedList = uploadPageControls
          /*
           *  But there may be more than one upload component per page
           */
          .reduce((accumulator, { name, label: componentName = name }, componentIndex, components) => accumulator.concat(
            acceptedList
              /*
               *  And each upload component may have several uploads
               */
              .filter(({ fieldName }) => getComponentName(fieldName) === name)
              /*
               *  Ensure the uploads are sorted in order of upload
               */
              .sort(({ timestamp: alpha }, { timestamp: omega }) => new Date(alpha).valueOf() - new Date(omega).valueOf())
              /*
               *  Create the content for the summary list row
               */
              .map(({ originalname, size, uuid }, componentUploadIndex, componentUploads) => {
                const count = componentUploadIndex + 1
                const rowIndiciaText = getString('uploadSummary.summaryList.row.indicia', lang)
                const buttonText = getString('uploadSummary.summaryList.button.delete', lang)
                const visuallyHiddenText = getString('uploadSummary.summaryList.button.visuallyHidden', lang)

                const options = { lang }

                return {
                  key: {
                    text: format(rowIndiciaText, { componentName }, options)
                  },
                  value: {
                    text: `${originalname}, ${bytes(size)}`
                  },
                  actions: {
                    items: [
                      {
                        html: `<button type="submit" name="upload-component-remove-id" value="${uuid}" class="govuk-button govuk-button--secondary">${buttonText}</button>`,
                        visuallyHiddenText: format(visuallyHiddenText, { count }, options)
                      }
                    ]
                  }
                }
              })
          ), [])

        const uploadSummary = {
          _id: 'page.uploadSummary.summaryList',
          _type: 'uploadSummary',
          name: 'uploadSummary'
        }

        const {
          'upload-component-field-name': fieldName
        } = userData.getUserData()

        const count = Array.isArray(fieldName) ? fieldName.length : 1

        const maxFiles = uploadPageControls.reduce((max, component) => Math.max(max, getComponentMaxFiles(component)), 0)
        const minFiles = uploadPageControls.reduce((min, component) => Math.max(min, getComponentMinFiles(component)), 0) // Math.max!

        const hasMaxFiles = uploadPageControls.every((component) => hasComponentAcceptedMaxFiles(component, userData))
        const hasMinFiles = uploadPageControls.every((component) => hasComponentAcceptedMinFiles(component, userData))

        /*
         *  The sum of all components' uploads
         */
        const uploadCount = uploadedList.length

        uploadSummary.uploadedList = uploadedList
        uploadSummary.maxFiles = maxFiles
        uploadSummary.minFiles = minFiles
        uploadSummary.hasMaxFiles = hasMaxFiles
        uploadSummary.hasMinFiles = hasMinFiles
        uploadSummary.uploadCount = uploadCount

        uploadSummary.summaryListHeading = format(
          getString('uploadSummary.summaryList.heading', userData.contentLang),
          { count }, { lang }
        )

        pageInstance.uploadComponentPageId = pageId

        if (hasComponentsAcceptedMaxFiles(uploadPageInstance, userData)) {
          pageInstance.components = components.concat(uploadSummary)
        } else {
          pageInstance.components = components.concat(uploadSummary, createRadios(userData, count))
        }
      }
    }

    return pageInstance
  }

  /*
   *  POST
   */
  async postValidation (pageInstance, userData) {
    const {
      'upload-component-page-id': pageId
    } = userData.getBodyInput()

    userData.setUserDataProperty('upload-component-page-id', pageId)

    if (this.hasRemoveUpload(userData)) {
      const upload = this.getRemoveUpload(userData)

      if (hasComponentAcceptedFileByUUID(userData, upload)) {
        const uploadItem = getComponentAcceptedFileByUUID(userData, upload)

        removeFromComponentAcceptedFiles(userData, uploadItem)

        userData.setFlashMessage({
          type: 'file.removed',
          html: format(
            getString('flash.file.removed', userData.contentLang), { filename: uploadItem.originalname }, { lang: userData.contentLang }
          )
        })

        await userData.saveData()
      }
    }

    return pageInstance
  }
}
