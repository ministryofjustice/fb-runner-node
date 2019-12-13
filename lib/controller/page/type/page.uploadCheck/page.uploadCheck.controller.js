require('@ministryofjustice/module-alias/register-module')(module)

const {
  getInstance,
  getString
} = require('~/fb-runner-node/service-data/service-data')

const {
  getRedirectForNextPage,
  getRedirectForPreviousPage,
  getRedirectFromPageToPage
} = require('~/fb-runner-node/page/page')

const {
  getUploadControls,
  getUploadMaxFiles,
  getUploadMinFiles,
  hasUploadMaxFiles,
  hasUploadMinFiles,
  getUploadFiles,
  setUploadFiles,
  clearUploadFiles,
  addToAcceptedFiles,
  removeFromAcceptedFiles,
  hasAcceptedFile,
  getAcceptedFile
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  format
} = require('~/fb-runner-node/format/format')

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

const getUploadList = (pageInstance, userData) => getUploadControls(pageInstance)
  .reduce((accumulator, component) => accumulator.concat(getUploadFiles(component, userData)), [])
  .sort(({timestamp: alpha}, {timestamp: omega}) => new Date(alpha).valueOf() - new Date(omega).valueOf())

function prepareUploadCheckPage (pageInstance, userData, uploadList) {
  const {
    uploadPage,
    fieldName
  } = userData.getUserData()

  const {
    components = []
  } = pageInstance

  const uploadCheck = {
    _id: 'page.uploadCheck.upload',
    _type: 'uploadCheck',
    name: 'uploadCheck'
  }

  const maxFiles = components.reduce((max, component) => Math.max(max, getUploadMaxFiles(component)), 0)
  const minFiles = components.reduce((min, component) => Math.max(min, getUploadMinFiles(component)), 0) // Math.max!
  const hasMaxFiles = components.every((component, userData) => hasUploadMaxFiles(component, userData))
  const hasMinFiles = components.every((component, userData) => hasUploadMinFiles(component, userData))

  uploadCheck.uploadPage = uploadPage
  uploadCheck.uploadList = uploadList
  uploadCheck.maxFiles = maxFiles
  uploadCheck.minFiles = minFiles
  uploadCheck.hasMaxFiles = hasMaxFiles
  uploadCheck.hasMinFiles = hasMinFiles

  const count = Array.isArray(fieldName) ? fieldName.length : 1

  uploadCheck.upload = uploadList.slice().reverse().slice(0, count)

  pageInstance.components = components.concat(uploadCheck, createRadios(userData, count))

  return pageInstance
}

/*
 *  GET and POST
 */
async function preFlight (pageInstance, userData) {
  userData.unsetUserDataProperty('decision')

  await userData.saveData()

  return pageInstance
}

const mapFieldNameAccepted = (userData, uploadList) => (fieldName) => isFieldNameAccepted(userData, uploadList, fieldName)

const mapFileUUIDAccepted = (userData, uploadList) => (fieldName) => isFileUUIDAccepted(userData, uploadList, fieldName)

function isFieldNameAccepted (userData, uploadList, fieldName) {
  if (Array.isArray(fieldName)) {
    return fieldName.some(mapFieldNameAccepted(userData, uploadList))
  }

  return hasAcceptedFile(userData, fieldName)
}

function isFileUUIDAccepted (userData, uploadList, fieldName) {
  if (Array.isArray(fieldName)) {
    return fieldName.some(mapFileUUIDAccepted(userData, uploadList))
  }

  if (hasAcceptedFile(userData, fieldName)) { // isFieldNameAccepted(userData, uploadList, fieldName)) {
    const {
      uuid: alpha
    } = getAcceptedFile(userData, fieldName)

    return uploadList.some(({uuid: omega}) => alpha === omega)
  }

  return false
}

/*
 *  GET and POST
 */
async function setContents (pageInstance, userData, POST) {
  const {
    uploadPage
  } = userData.getUserData()

  if (uploadPage) {
    if (!POST) {
      const uploadList = getUploadList(getInstance(uploadPage), userData)

      const {
        fieldName
      } = userData.getUserData()

      if (isFieldNameAccepted(userData, uploadList, fieldName)) {
        if (isFileUUIDAccepted(userData, uploadList, fieldName)) { // Array.isArray(fieldName) ? fieldName.some((fieldName) => uploadList.some(({uuid}) => uuid === getAcceptedFile(userData, fieldName).uuid)) : uploadList.some(({uuid}) => uuid === getAcceptedFile(userData, fieldName).uuid)) {
          pageInstance.$validated = true
          pageInstance = await getRedirectFromPageToPage(pageInstance, getInstance(uploadPage), userData)
        } else {
          pageInstance = prepareUploadCheckPage(pageInstance, userData, uploadList)
        }
      } else {
        pageInstance = prepareUploadCheckPage(pageInstance, userData, uploadList)
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
    uploadPage,
    upload
  } = userData.getBodyInput()

  userData.setUserDataProperty('uploadPage', uploadPage)
  userData.setUserDataProperty('upload', upload)

  if (isUploadAccepted(userData)) {
    /*
     *  Accepted
     */
    getUploadControls(getInstance(uploadPage))
      .forEach((component) => {
        const was = getUploadFiles(component, userData)
        const uploadItem = was.find(({uuid}) => Array.isArray(upload) ? upload.includes(uuid) : uuid === upload)
        if (uploadItem) {
          const {
            fieldname: fieldName,
            ...file
          } = uploadItem

          addToAcceptedFiles(userData, {...file, fieldName})
        }
      })
  } else {
    /*
     *  Rejected or otherwise
     */
    if (isUploadRejected(userData)) {
      /*
       *  Rejected
       */
      getUploadControls(getInstance(uploadPage))
        .forEach((component) => {
          const was = getUploadFiles(component, userData)
          const uploadItem = was.find(({uuid}) => Array.isArray(upload) ? upload.includes(uuid) : uuid === upload)
          if (uploadItem) {
            const {
              fieldname: fieldName,
              ...file
            } = uploadItem

            removeFromAcceptedFiles(userData, {...file, fieldName})

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
