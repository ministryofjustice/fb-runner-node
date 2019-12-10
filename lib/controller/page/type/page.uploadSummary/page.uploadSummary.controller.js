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
    uploadPage
  } = userData.getUserData()

  if (uploadPage) {
    const {
      components = []
    } = pageInstance

    const {
      contentLang: lang
    } = userData

    const uploadList = getUploadControls(getInstance(uploadPage))
      .reduce((accumulator, component) => accumulator.concat(getUploadFiles(component, userData)), [])
      .sort(({timestamp: alpha}, {timestamp: omega}) => new Date(alpha).valueOf() - new Date(omega).valueOf())
      .map(({originalname, size, uuid}, index) => {
        const count = index + 1

        const rowIndiciaText = getString('uploadSummary.summaryList.row.indicia', lang)
        const buttonText = getString('uploadSummary.summaryList.button.delete', lang)
        const visuallyHiddenText = getString('uploadSummary.summaryList.button.visuallyHidden', lang)

        return {
          key: {
            text: format(rowIndiciaText, {count}, {lang})
          },
          value: {
            text: `${originalname}, ${bytes(size)}`
          },
          actions: {
            items: [
              {
                html: `<button type="submit" name="removeUpload" value="${uuid}" class="govuk-button govuk-button--secondary">${buttonText}</button>`,
                visuallyHiddenText: format(visuallyHiddenText, {count}, {lang})
              }
            ]
          }
        }
      })

    const component = {
      _id: 'page.uploadSummary.summaryList',
      _type: 'uploadSummary',
      name: 'uploadSummary'
    }

    const {
      fieldName
    } = userData.getUserData()

    const count = Array.isArray(fieldName) ? fieldName.length : 1

    component.uploadPage = uploadPage
    component.uploadList = uploadList
    component.summaryListHeading = format(
      getString('uploadSummary.summaryList.heading', userData.contentLang),
      {count}, {lang}
    )

    pageInstance.components = components.concat(component, createRadios(userData, count))
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

    getUploadControls(getInstance(uploadPage))
      .forEach(async (component) => {
        const was = getUploadFiles(component, userData)
        const uploadItem = was.find(({uuid}) => uuid === upload)
        if (uploadItem) {
          const now = was.filter((item) => item !== uploadItem)

          if (now.length) {
            setUploadFiles(component, now, userData)
          } else {
            clearUploadFiles(component, userData)
          }

          userData.setFlashMessage({
            type: 'file.removed',
            html: format(
              getString('flash.file.removed', userData.contentLang), {filename: uploadItem.originalname}, {lang: userData.contentLang}
            )
          })

          await userData.saveData()
        }
      })
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

    const count = getUploadControls(controlPageInstance)
      .reduce((accumulator, component) => accumulator + getUploadFileCount(component, userData), 0)

    return count
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

    switch (decision) {
      case 'confirm':
      {
        const {
          uploadPage
        } = userData.getBodyInput()

        return getRedirectFromPageToPage(pageInstance, getInstance(uploadPage), userData)
      }
      case 'decline':

        return getRedirectForNextPage(pageInstance, userData)
      default:

        return pageInstance
    }
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
