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

function isUploadAccepted ({getBodyInput}) {
  const {
    decision
  } = getBodyInput()

  return decision === 'accept'
}

function isUploadRejected ({getBodyInput}) {
  const {
    decision
  } = getBodyInput()

  return decision === 'reject'
}

function createRadios (userData) {
  return {
    _id: 'page.uploadCheck.radios',
    _type: 'radios',
    name: 'decision',
    legend: getString('uploadCheck.radios.legend', userData.contentLang),
    items: [
      {
        _id: 'page.uploadCheck.radios-accept',
        _type: 'radio',
        label: getString('uploadCheck.radios.acceptUpload', userData.contentLang),
        value: 'accept'
      },
      {
        _id: 'page.uploadCheck.radios-reject',
        _type: 'radio',
        label: getString('uploadCheck.radios.rejectUpload', userData.contentLang),
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
async function setContents (pageInstance, userData) {
  console.log('lib/controller/page/type/page.uploadCheck/page.uploadCheck.controller:setContents()')

  const {
    components = []
  } = pageInstance

  const component = {
    _id: 'page.uploadCheck.upload',
    _type: 'uploadCheck',
    name: 'uploadCheck'
  }

  const {
    uploadPage
  } = userData.getUserData()

  if (uploadPage) {
    const uploadList = getUploadControls(getInstance(uploadPage))
      .reduce((accumulator, component) => accumulator.concat(getUploadFiles(component, userData)), [])
      .sort(({timestamp: alpha}, {timestamp: omega}) => new Date(alpha).valueOf() - new Date(omega).valueOf())

    const [
      upload
    ] = uploadList

    component.uploadPage = uploadPage
    component.uploadList = uploadList
    component.upload = upload
  }

  pageInstance.components = components.concat(component, createRadios(userData))

  return pageInstance
}

/*
 *  POST
 */
async function postValidation (pageInstance, userData) {
  console.log('lib/controller/page/type/page.uploadCheck/page.uploadCheck.controller:postValidation()')

  const {
    uploadPage,
    upload
  } = userData.getBodyInput()

  userData.setUserDataProperty('uploadPage', uploadPage)
  userData.setUserDataProperty('upload', upload)

  if (isUploadRejected(userData)) {
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
async function resolveRoute (pageInstance, userData) {
  if (isUploadAccepted(userData)) {
    return getRedirectForNextPage(pageInstance, userData)
  }

  if (isUploadRejected(userData)) {
    return getRedirectForPreviousPage(pageInstance, userData)
  }
}

module.exports = {
  isUploadAccepted,
  isUploadRejected,
  resolveRoute,
  setContents,
  postValidation
}