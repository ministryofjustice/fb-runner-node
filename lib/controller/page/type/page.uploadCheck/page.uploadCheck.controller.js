require('@ministryofjustice/module-alias/register-module')(module)

const {
  getInstance,
  getString
} = require('~/fb-runner-node/service-data/service-data')

const {
  getRedirectForNextPage,
  getRedirectForPreviousPage
} = require('~/fb-runner-node/page/page')

const {
  getUploadControls, /*
  getUploadMaxFiles,
  getUploadMinFiles,
  getUploadFileCount, */
  getUploadFiles,
  setUploadFiles,
  clearUploadFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  format
} = require('~/fb-runner-node/format/format')

/*
preFlight
setContents
postValidation
preUpdateContents
preRender
*/

function getDecision ({getBodyInput}) {
  const {
    decision
  } = getBodyInput()

  return decision
}

const isUploadAccepted = (userData) => getDecision(userData) === 'accept'

const isUploadRejected = (userData) => getDecision(userData) === 'reject'

function createRadios ({contentLang: lang}, count = 0) {
  const values = {count}
  const params = {lang}

  return {
    _id: 'page.uploadCheck.radios',
    _type: 'radios',
    name: 'decision',
    legend: format(
      getString('uploadCheck.radios.legend', lang),
      values,
      params
    ),
    items: [
      {
        _id: 'page.uploadCheck.radios-accept',
        _type: 'radio',
        label: format(
          getString('uploadCheck.radios.acceptUpload', lang),
          values,
          params
        ),
        value: 'accept'
      },
      {
        _id: 'page.uploadCheck.radios-reject',
        _type: 'radio',
        label: format(
          getString('uploadCheck.radios.rejectUpload', lang),
          values,
          params
        ),
        value: 'reject'
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

    const uploadList = getUploadControls(getInstance(uploadPage))
      .reduce((accumulator, component) => accumulator.concat(getUploadFiles(component, userData)), [])
      .sort(({timestamp: alpha}, {timestamp: omega}) => new Date(alpha).valueOf() - new Date(omega).valueOf())

    const component = {
      _id: 'page.uploadCheck.upload',
      _type: 'uploadCheck',
      name: 'uploadCheck'
    }

    const {
      fieldName
    } = userData.getUserData()

    const count = Array.isArray(fieldName) ? fieldName.length : 1

    component.uploadPage = uploadPage
    component.uploadList = uploadList
    component.upload = uploadList.slice().reverse().slice(0, count)

    pageInstance.components = components.concat(component, createRadios(userData, count))
  }

  return pageInstance
}

/*
 *  POST
 */
async function postValidation (pageInstance, userData) {
  const {
    uploadPage,
    upload
  } = userData.getBodyInput()

  userData.setUserDataProperty('uploadPage', uploadPage)
  userData.setUserDataProperty('upload', upload)

  console.log({
    uploadPage,
    upload
  })

  if (isUploadRejected(userData)) {
    getUploadControls(getInstance(uploadPage))
      .forEach((component) => {
        const was = getUploadFiles(component, userData)
        const uploadItem = was.find(({uuid}) => Array.isArray(upload) ? upload.includes(uuid) : uuid === upload)
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
        }
      })
  }

  await userData.saveData()

  return pageInstance
}

/*
 *  POST
 */
async function resolveRoute (pageInstance, userData) {
  try {
    const decision = getDecision(userData)

    switch (decision) {
      case 'accept':

        return getRedirectForNextPage(pageInstance, userData)
      case 'reject':

        return getRedirectForPreviousPage(pageInstance, userData)
      default:

        return pageInstance
    }
  } catch (e) {
    return pageInstance
  }
}

module.exports = {
  isUploadAccepted,
  isUploadRejected,
  resolveRoute,
  preFlight,
  setContents,
  postValidation
}
