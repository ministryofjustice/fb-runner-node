require('@ministryofjustice/module-alias/register-module')(module)

const CommonController = require('~/fb-runner-node/controller/page/common')

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

function createRadios ({contentLang: lang}, count = 0) {
  const values = {count}
  const params = {lang}

  return {
    _id: 'page.uploadSummary.radios',
    _type: 'radios',
    name: 'decision',
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
  hasRemoveUpload ({getBodyInput}) { return Reflect.has(getBodyInput(), 'removeUpload') }

  getRemoveUpload ({getBodyInput}) { return Reflect.get(getBodyInput(), 'removeUpload') }

  confirmAnother ({getBodyInput}) {
    const {
      decision
    } = getBodyInput()

    return decision === 'confirm'
  }

  declineAnother ({getBodyInput}) {
    const {
      decision
    } = getBodyInput()

    return decision === 'decline'
  }

  /*
   *  POST
   */
  async resolveRouteForRemoveUpload (summaryPageInstance, userData) {
    try {
      const {
        uploadPage
      } = userData.getBodyInput()

      const controlPageInstance = getInstance(uploadPage)

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
        decision
      } = userData.getBodyInput()

      const {
        uploadPage
      } = userData.getBodyInput()

      if (uploadPage) {
        if (decision === 'confirm') {
          getComponents(getInstance(uploadPage))
            .forEach((component) => {
              clearComponentFiles(component, userData)
            })

          return getRedirectFromPageToPage(pageInstance, getInstance(uploadPage), userData)
        } else {
          const {
            accepted
          } = userData.getUserData()

          getComponents(getInstance(uploadPage))
            .forEach((component) => {
              const {name} = component

              userData.setUserDataProperty(name, accepted
                .filter(({fieldName}) => getComponentName(fieldName) === name)
                .map(({fieldName, fieldname = fieldName, ...file}) => ({...file, fieldname})))

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
    if (Reflect.has(userData.getUserData(), 'accepted')) {
      userData.unsetUserDataProperty('decision')

      await userData.saveData()
    } else {
      const uploadPage = userData.getUserDataProperty('uploadPage')

      pageInstance.redirect = getUrl(uploadPage, {}, userData.contentLang)
    }

    return pageInstance
  }

  /*
   *  GET and POST
   */
  async setContents (pageInstance, userData) {
    const {
      uploadPage,
      accepted: acceptList = []
    } = userData.getUserData()

    if (uploadPage) {
      const {
        components = []
      } = pageInstance

      const {
        contentLang: lang
      } = userData

      const uploadPageInstance = getInstance(uploadPage)
      const uploadPageControls = getComponents(uploadPageInstance)

      if (hasComponentsAcceptedMinFiles(uploadPageInstance, userData)) {
        /*
         *  One upload list
         */
        const uploadList = uploadPageControls
          /*
           *  But there may be more than one upload component per page
           */
          .reduce((accumulator, {name, label: componentName = name}, componentIndex, components) => accumulator.concat(
            acceptList
              /*
               *  And each upload component may have several uploads
               */
              .filter(({fieldName}) => getComponentName(fieldName) === name)
              /*
               *  Ensure the uploads are sorted in order of upload
               */
              .sort(({timestamp: alpha}, {timestamp: omega}) => new Date(alpha).valueOf() - new Date(omega).valueOf())
              /*
               *  Create the content for the summary list row
               */
              .map(({originalname, size, uuid}, componentUploadIndex, componentUploads) => {
                const count = componentUploadIndex + 1
                const rowIndiciaText = getString('uploadSummary.summaryList.row.indicia', lang)
                const buttonText = getString('uploadSummary.summaryList.button.delete', lang)
                const visuallyHiddenText = getString('uploadS2000ummary.summaryList.button.visuallyHidden', lang)

                const options = {lang}

                return {
                  key: {
                    text: format(rowIndiciaText, {componentName}, options)
                  },
                  value: {
                    text: `${originalname}, ${bytes(size)}`
                  },
                  actions: {
                    items: [
                      {
                        html: `<button type="submit" name="removeUpload" value="${uuid}" class="govuk-button govuk-button--secondary">${buttonText}</button>`,
                        visuallyHiddenText: format(visuallyHiddenText, {count}, options)
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
          fieldName
        } = userData.getUserData()

        const count = Array.isArray(fieldName) ? fieldName.length : 1

        const maxFiles = uploadPageControls.reduce((max, component) => Math.max(max, getComponentMaxFiles(component)), 0)
        const minFiles = uploadPageControls.reduce((min, component) => Math.max(min, getComponentMinFiles(component)), 0) // Math.max!

        const hasMaxFiles = uploadPageControls.every((component) => hasComponentAcceptedMaxFiles(component, userData))
        const hasMinFiles = uploadPageControls.every((component) => hasComponentAcceptedMinFiles(component, userData))

        /*
         *  The sum of all components' uploads
         */
        const uploadCount = uploadList.length

        uploadSummary.uploadPage = uploadPage
        uploadSummary.uploadList = uploadList
        uploadSummary.maxFiles = maxFiles
        uploadSummary.minFiles = minFiles
        uploadSummary.hasMaxFiles = hasMaxFiles
        uploadSummary.hasMinFiles = hasMinFiles
        uploadSummary.uploadCount = uploadCount

        uploadSummary.summaryListHeading = format(
          getString('uploadSummary.summaryList.heading', userData.contentLang),
          {count}, {lang}
        )

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
      uploadPage
    } = userData.getBodyInput()

    userData.setUserDataProperty('uploadPage', uploadPage)

    if (this.hasRemoveUpload(userData)) {
      const upload = this.getRemoveUpload(userData)

      if (hasComponentAcceptedFileByUUID(userData, upload)) {
        const uploadItem = getComponentAcceptedFileByUUID(userData, upload)

        removeFromComponentAcceptedFiles(userData, uploadItem)

        userData.setFlashMessage({
          type: 'file.removed',
          html: format(
            getString('flash.file.removed', userData.contentLang), {filename: uploadItem.originalname}, {lang: userData.contentLang}
          )
        })

        await userData.saveData()
      }
    }

    return pageInstance
  }
}
