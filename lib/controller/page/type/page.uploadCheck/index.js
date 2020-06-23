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
  getRedirectForPreviousPage,
  getRedirectFromPageToPage
} = require('~/fb-runner-node/page/page')

const {
  getComponents,
  getComponentMaxFiles,
  getComponentMinFiles,
  hasComponentMaxFiles,
  hasComponentMinFiles,
  getComponentFiles,
  setComponentFiles,
  clearComponentFiles,
  addToComponentAcceptedFiles,
  removeFromComponentAcceptedFiles,
  hasComponentAcceptedFile
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  format
} = require('~/fb-runner-node/format/format')

const log = debug('runner:page:upload-check')

function getDecision ({ getBodyInput }) {
  const {
    'upload-component-decision': decision
  } = getBodyInput()

  return decision
}

function createRadios ({ contentLang: lang }, count = 0) {
  const values = { count }
  const params = { lang }

  return {
    _id: 'page.uploadCheck.radios',
    _type: 'radios',
    name: 'upload-component-decision',
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

const getComponentFilesFor = (pageInstance, userData) => getComponents(pageInstance)
  .reduce((accumulator, component) => accumulator.concat(getComponentFiles(component, userData)), [])
  .sort(({ timestamp: alpha }, { timestamp: omega }) => new Date(alpha).valueOf() - new Date(omega).valueOf())

const hasUploadedFile = (uploaded, alpha) => uploaded.some(({ fieldname, fieldName: omega = fieldname }) => alpha === omega)

const getUploadedFile = (uploaded, alpha) => uploaded.find(({ fieldname, fieldName: omega = fieldname }) => alpha === omega) // eslint-disable-line

const mapFieldNameAccepted = (userData) => (fieldName) => isFieldNameAccepted(userData, fieldName)

const mapFieldNameUploaded = (uploaded) => (fieldName) => isFieldNameUploaded(uploaded, fieldName)

function isFieldNameAccepted (userData, fieldName) {
  if (Array.isArray(fieldName)) {
    return fieldName.some(mapFieldNameAccepted(userData))
  }

  return hasComponentAcceptedFile(userData, fieldName)
}

function isFieldNameUploaded (uploaded, fieldName) {
  if (Array.isArray(fieldName)) {
    return fieldName.some(mapFieldNameUploaded(uploaded))
  }

  return hasUploadedFile(uploaded, fieldName)
}

function prepareUploadCheckPage (pageInstance, userData, uploadedList) {
  const {
    'upload-component-page-id': pageId,
    'upload-component-field-name': fieldName
  } = userData.getUserData()

  log({ pageId, fieldName })

  const {
    components = []
  } = pageInstance

  const uploadCheck = {
    _id: 'page.uploadCheck.upload',
    _type: 'uploadCheck',
    name: 'uploadCheck'
  }

  const maxFiles = components.reduce((max, component) => Math.max(max, getComponentMaxFiles(component)), 0)
  const minFiles = components.reduce((min, component) => Math.max(min, getComponentMinFiles(component)), 0) // Math.max!
  const hasMaxFiles = components.every((component, userData) => hasComponentMaxFiles(component, userData))
  const hasMinFiles = components.every((component, userData) => hasComponentMinFiles(component, userData))

  uploadCheck.uploadedList = uploadedList
  uploadCheck.uploadDescriptions = uploadedList.map(({ originalname, size }) => `${originalname}, ${bytes(size)}`)
  uploadCheck.maxFiles = maxFiles
  uploadCheck.minFiles = minFiles
  uploadCheck.hasMaxFiles = hasMaxFiles
  uploadCheck.hasMinFiles = hasMinFiles

  const count = Array.isArray(fieldName) ? fieldName.length : 1

  uploadCheck.acceptedList = uploadedList.slice().reverse().slice(0, count)

  pageInstance.uploadComponentPageId = pageId

  pageInstance.components = components.concat(uploadCheck, createRadios(userData, count))

  return pageInstance
}

module.exports = class UploadCheckController extends CommonController {
  isUploadAccepted (userData) { return getDecision(userData) === 'accept' }

  isUploadRejected (userData) { return getDecision(userData) === 'reject' }

  /*
   *  POST
   */
  async resolveRoute (pageInstance, userData) {
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

  /*
   *  GET and POST
   */
  async preFlight (pageInstance, userData) {
    userData.unsetUserDataProperty('upload-component-decision')

    await userData.saveData()

    return pageInstance
  }

  /*
   *  GET and POST
   */
  async setContents (pageInstance, userData, POST) {
    const {
      'upload-component-page-id': pageId
    } = userData.getUserData()

    if (pageId) {
      if (!POST) {
        const uploaded = getComponentFilesFor(getInstance(pageId), userData)

        const {
          'upload-component-field-name': fieldName
        } = userData.getUserData()

        if (isFieldNameAccepted(userData, fieldName)) {
          if (isFieldNameUploaded(uploaded, fieldName)) {
            /*
             *  Is in accepted list
             *  Is in uploaded list
             *    - Uploaded (Back, uploaded)
             */
            pageInstance = prepareUploadCheckPage(pageInstance, userData, uploaded)
          } else {
            /*
             *  Is in accepted list
             *  Not in uploaded list
             *    - Redirect (Back, deleted)
             */
            pageInstance.$validated = true
            pageInstance = await getRedirectFromPageToPage(pageInstance, getInstance(pageId), userData)
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
            pageInstance = await getRedirectFromPageToPage(pageInstance, getInstance(pageId), userData)
          }
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
      'upload-component-page-id': pageId,
      'upload-component-accept-id': acceptId
    } = userData.getBodyInput()

    userData.setUserDataProperty('upload-component-page-id', pageId)
    userData.setUserDataProperty('upload-component-accept-id', acceptId)

    if (this.isUploadAccepted(userData)) {
      /*
       *  Accepted
       */
      getComponents(getInstance(pageId))
        .forEach((component) => {
          const was = getComponentFiles(component, userData)

          const uploadItem = was.find(({ uuid }) => Array.isArray(acceptId) ? acceptId.includes(uuid) : uuid === acceptId)

          if (uploadItem) {
            const {
              fieldname: fieldName,
              ...file
            } = uploadItem

            /*
             *  The upload has been accepted by the user so we want to add it to the list of accepted files ...
             */
            addToComponentAcceptedFiles(userData, { ...file, fieldName })

            const now = was.filter((item) => item !== uploadItem) // .concat(uploadItem)

            /*
             *  ... and remove it from the list of uploaded files (which is "uploaded but not accepted yet")
             */
            if (now.length) {
              setComponentFiles(component, now, userData)
            } else {
              clearComponentFiles(component, userData)
            }
          }
        })
    } else {
      /*
       *  Rejected or otherwise
       */
      if (this.isUploadRejected(userData)) {
        /*
         *  Rejected
         */
        getComponents(getInstance(pageId))
          .forEach((component) => {
            const was = getComponentFiles(component, userData)
            const uploadItem = was.find(({ uuid }) => Array.isArray(acceptId) ? acceptId.includes(uuid) : uuid === acceptId)
            if (uploadItem) {
              const {
                fieldname: fieldName,
                ...file
              } = uploadItem

              removeFromComponentAcceptedFiles(userData, { ...file, fieldName })

              const now = was.filter((item) => item !== uploadItem)

              if (now.length) {
                setComponentFiles(component, now, userData)
              } else {
                clearComponentFiles(component, userData)
              }

              userData.setFlashMessage({
                type: 'file.removed',
                html: format(
                  getString('flash.file.removed', userData.contentLang), { filename: uploadItem.originalname }, { lang: userData.contentLang }
                )
              })
            }
          })
      }
    }

    await userData.saveData()

    return pageInstance
  }
}
