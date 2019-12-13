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

const getUploadedFiles = (pageInstance, userData) => getUploadControls(pageInstance)
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

const hasUploadedFile = (uploaded, alpha) => uploaded.some(({fieldname, fieldName: omega = fieldname}) => alpha === omega)

const getUploadedFile = (uploaded, alpha) => uploaded.find(({fieldname, fieldName: omega = fieldname}) => alpha === omega) // eslint-disable-line

const mapFieldNameAccepted = (userData) => (fieldName) => isFieldNameAccepted(userData, fieldName)

const mapFieldNameUploaded = (uploaded) => (fieldName) => isFieldNameUploaded(uploaded, fieldName)

function isFieldNameAccepted (userData, fieldName) {
  if (Array.isArray(fieldName)) {
    return fieldName.some(mapFieldNameAccepted(userData))
  }

  return hasAcceptedFile(userData, fieldName)
}

function isFieldNameUploaded (uploaded, fieldName) {
  if (Array.isArray(fieldName)) {
    return fieldName.some(mapFieldNameUploaded(uploaded))
  }

  return hasUploadedFile(uploaded, fieldName)
}

const mapCompareByUUID = (userData, uploaded) => (fieldName) => compareByUUID(userData, uploaded, fieldName)

function compareByUUID (userData, uploaded, fieldName) {
  if (Array.isArray(fieldName)) {
    return fieldName.some(mapCompareByUUID(userData, uploaded))
  }

  if (hasAcceptedFile(userData, fieldName)) {
    const {
      uuid: alpha
    } = getAcceptedFile(userData, fieldName)

    return uploaded.some(({uuid: omega}) => alpha === omega)
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
      const uploaded = getUploadedFiles(getInstance(uploadPage), userData)

      const {
        fieldName
      } = userData.getUserData()

      if (isFieldNameAccepted(userData, fieldName)) {
        if (compareByUUID(userData, uploaded, fieldName)) {
          /*
           *  Is in accepted list
           *  Has matching UUID
           *    - Redirect (Back)
           */
          pageInstance.$validated = true
          pageInstance = await getRedirectFromPageToPage(pageInstance, getInstance(uploadPage), userData)
        } else {
          /*
           *  Is in accepted list
           *  Not matching UUID
           *    - Uploaded (replace)
           */
          pageInstance = prepareUploadCheckPage(pageInstance, userData, uploaded)
        }
      } else {
        if (isFieldNameUploaded(uploaded, fieldName)) {
          /*
           *  Not in accepted list
           *  Is in uploaded list
           *    - Uploaded
           */
          pageInstance = prepareUploadCheckPage(pageInstance, userData, uploaded)
        } else {
          /*
           *  Not in accepted list
           *  Not in uploaded list
           *    - Redirect (Back, deleted)
           */
          pageInstance.$validated = true
          pageInstance = await getRedirectFromPageToPage(pageInstance, getInstance(uploadPage), userData)
        }
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
