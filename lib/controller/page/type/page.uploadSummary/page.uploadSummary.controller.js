require('@ministryofjustice/module-alias/register-module')(module)

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
  getUploadControls,
  getUploadedMaxFiles,
  getUploadedMinFiles,
  hasAcceptedMaxFiles,
  hasAcceptedMinFiles,
  hasAcceptedMaxFilesForUploadControls,
  hasAcceptedMinFilesForUploadControls,
  removeFromAcceptedFiles,
  hasAcceptedFileByUUID,
  getAcceptedFileByUUID
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  getUploadControlName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  format
} = require('~/fb-runner-node/format/format')

function confirmAnother ({getBodyInput}) {
  const {
    decision
  } = getBodyInput()

  return decision === 'confirm'
}

function declineAnother ({getBodyInput}) {
  const {
    decision
  } = getBodyInput()

  return decision === 'decline'
}

const hasRemoveUpload = ({getBodyInput}) => Reflect.has(getBodyInput(), 'removeUpload')

const getRemoveUpload = ({getBodyInput}) => Reflect.get(getBodyInput(), 'removeUpload')

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

/*
 *  GET and POST
 */
async function preFlight (pageInstance, userData) {
  userData.unsetUserDataProperty('decision')

  await userData.saveData()

  return pageInstance
}

/*
 *  GET and POST
 */
async function setContents (pageInstance, userData) {
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
    const uploadPageControls = getUploadControls(uploadPageInstance)

    if (hasAcceptedMinFilesForUploadControls(uploadPageInstance, userData)) {
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
            .filter(({fieldName}) => getUploadControlName(fieldName) === name)
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

      const maxFiles = uploadPageControls.reduce((max, component) => Math.max(max, getUploadedMaxFiles(component)), 0)
      const minFiles = uploadPageControls.reduce((min, component) => Math.max(min, getUploadedMinFiles(component)), 0) // Math.max!

      const hasMaxFiles = uploadPageControls.every((component) => hasAcceptedMaxFiles(component, userData))
      const hasMinFiles = uploadPageControls.every((component) => hasAcceptedMinFiles(component, userData))

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

      if (hasAcceptedMaxFilesForUploadControls(uploadPageInstance, userData)) {
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
async function postValidation (pageInstance, userData) {
  const {
    uploadPage
  } = userData.getBodyInput()

  userData.setUserDataProperty('uploadPage', uploadPage)

  if (hasRemoveUpload(userData)) {
    const upload = getRemoveUpload(userData)

    if (hasAcceptedFileByUUID(userData, upload)) {
      const uploadItem = getAcceptedFileByUUID(userData, upload)

      removeFromAcceptedFiles(userData, uploadItem)

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

/*
 *  POST
 */
async function resolveRouteForRemoveUpload (summaryPageInstance, userData) {
  try {
    const {
      uploadPage
    } = userData.getBodyInput()

    const controlPageInstance = getInstance(uploadPage)

    return hasAcceptedMinFilesForUploadControls(controlPageInstance, userData)
      ? summaryPageInstance
      : controlPageInstance
  } catch (e) {
    return summaryPageInstance
  }
}

/*
 *  POST
 */
async function resolveRoute (pageInstance, userData) {
  try {
    const {
      decision
    } = userData.getBodyInput()

    const {
      uploadPage
    } = userData.getBodyInput()

    if (uploadPage) {
      if (decision === 'confirm') {
        return getRedirectFromPageToPage(pageInstance, getInstance(uploadPage), userData)
      } else {
        const {
          accepted
        } = userData.getUserData()

        getUploadControls(getInstance(uploadPage))
          .forEach(({name}) => {
            userData.setUserDataProperty(name, accepted
              .filter(({fieldName}) => getUploadControlName(fieldName) === name)
              .map(({fieldName, fieldname = fieldName, ...file}) => ({...file, fieldname})))
          })

        userData.unsetUserDataProperty('accepted')

        await userData.saveData()
      }
    }

    return getRedirectForNextPage(pageInstance, userData)
  } catch (e) {
    return pageInstance
  }
}

module.exports = {
  hasRemoveUpload,
  getRemoveUpload,
  confirmAnother,
  declineAnother,
  resolveRouteForRemoveUpload,
  resolveRoute,
  preFlight,
  setContents,
  postValidation
}
