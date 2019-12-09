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
  getUploadControls, /*
  getUploadMaxFiles,
  getUploadMinFiles, */
  getUploadFileCount,
  getUploadFiles,
  setUploadFiles,
  clearUploadFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

/*
preFlight
setContents
postValidation
preUpdateContents
preRender
*/

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

function createRadios (userData) {
  return {
    _id: 'page.uploadSummary.radios',
    _type: 'radios',
    name: 'decision',
    legend: getString('uploadSummary.radios.legend', userData.contentLang),
    items: [
      {
        _id: 'page.uploadSummary.radios-confirm',
        _type: 'radio',
        label: getString('uploadSummary.radios.confirmAnother', userData.contentLang),
        value: 'confirm'
      },
      {
        _id: 'page.uploadSummary.radios-decline',
        _type: 'radio',
        label: getString('uploadSummary.radios.declineAnother', userData.contentLang),
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
async function setContents (pageInstance, userData) {
  console.log('lib/controller/page/type/page.uploadSummary/page.uploadSummary.controller:setContents()')

  const {
    components = []
  } = pageInstance

  const component = {
    _id: 'page.uploadSummary.summaryList',
    _type: 'uploadSummary',
    name: 'uploadSummary'
  }

  const {
    uploadPage
  } = userData.getUserData()

  if (uploadPage) {
    component.uploadPage = uploadPage
    component.uploadList = getUploadControls(getInstance(uploadPage))
      .reduce((accumulator, component) => accumulator.concat(getUploadFiles(component, userData)), [])
      .sort(({timestamp: alpha}, {timestamp: omega}) => new Date(alpha).valueOf() - new Date(omega).valueOf())
      .map(({originalname, size, uuid}, index) => {
        const count = index + 1

        const buttonText = getString('uploadSummary.summaryList.button.delete', userData.contentLang)
        const visuallyHiddenText = getString('uploadSummary.summaryList.button.visuallyHidden', userData.contentLang)

        return {
          key: {
            text: `Upload ${count}`
          },
          value: {
            text: `${originalname}, ${bytes(size)}`
          },
          actions: {
            items: [
              {
                html: `<button type="submit" name="removeUpload" value="${uuid}" class="govuk-button govuk-button--secondary">${buttonText}</button>`,
                visuallyHiddenText: format(visuallyHiddenText, {count}, {lang: userData.contentLang})
              }
            ]
          }
        }
      })

    component.summaryListHeading = getString('uploadSummary.summaryList.heading', userData.contentLang)
  }

  pageInstance.components = components.concat(component, createRadios(userData))

  return pageInstance
}

/*
 *  POST
 */
async function postValidation (pageInstance, userData) {
  console.log('lib/controller/page/type/page.uploadSummary/page.uploadSummary.controller:postValidation()')

  const {
    uploadPage
  } = userData.getBodyInput()

  userData.setUserDataProperty('uploadPage', uploadPage)

  if (hasRemoveUpload(userData)) {
    const upload = getRemoveUpload(userData)

    getUploadControls(getInstance(uploadPage))
      .forEach((component) => {
        const was = getUploadFiles(component, userData)
        const uploadItem = was.find(({uuid}) => uuid === upload)
        if (uploadItem) {
          const now = was.filter((item) => item !== uploadItem)

          userData.setFlashMessage({
            type: 'file.removed',
            html: format(
              getString('flash.file.removed', userData.contentLang), {filename: uploadItem.originalname}, {lang: userData.contentLang}
            )
          })

          if (now.length) {
            setUploadFiles(component, now, userData)
          } else {
            clearUploadFiles(component, userData)
          }
        }
      })
  }

  return pageInstance
}

/*
 *  POST
 */
async function resolveRouteForRemoveUpload (summaryPageInstance, userData) {
  const {
    uploadPage
  } = userData.getBodyInput()

  const controlPageInstance = getInstance(uploadPage)

  const count = getUploadControls(controlPageInstance)
    .reduce((accumulator, component) => accumulator + getUploadFileCount(component, userData), 0)

  return count
    ? summaryPageInstance
    : controlPageInstance
}

/*
 *  POST
 */
async function resolveRoute (pageInstance, userData) {
  const {
    uploadPage
  } = userData.getBodyInput()

  if (confirmAnother(userData)) {
    return getRedirectFromPageToPage(pageInstance, getInstance(uploadPage), userData)
  }

  if (declineAnother(userData)) {
    return getRedirectForNextPage(pageInstance, userData)
  }
}

module.exports = {
  hasRemoveUpload,
  getRemoveUpload,
  confirmAnother,
  declineAnother,
  resolveRouteForRemoveUpload,
  resolveRoute,
  setContents,
  postValidation
}
