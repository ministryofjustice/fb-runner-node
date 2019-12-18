require('@ministryofjustice/module-alias/register-module')(module)

const fs = require('fs')
const uuid = require('uuid')

const {
  getUploadControlName,
  getUploadControlType
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  getString
} = require('~/fb-runner-node/service-data/service-data')

const {
  format
} = require('~/fb-runner-node/format/format')

const userFileStoreClient = require('~/fb-runner-node/client/user/file-store/file-store')

const deleteFile = (filepath) => {
  fs.unlink(filepath, () => {})
}

const storeUploadedFiles = async (pageInstance, userData, {files, fileErrors} = {}) => {
  // TODO: never process the file in the removed slot in the first place
  const {removeSlot} = userData.getBodyInput()
  if (removeSlot && files[removeSlot]) {
    const removeSlotFile = files[removeSlot][0]
    delete files[removeSlot]
    deleteFile(removeSlotFile.path)
  }

  const userId = userData.getUserId()
  const userToken = userData.getUserToken()

  const fileList = Object.values(files).map(([file]) => file) // fieldname => files[fieldname][0])

  for await (const file of fileList) {
    const policy = {}

    if (file.maxSize) {
      policy.max_size = file.maxSize
    }
    if (file.expires) {
      policy.expires = file.expires
    }
    if (file.allowed_types) {
      policy.allowed_types = file.allowed_types
    }

    try {
      const alpha = await userFileStoreClient.storeFromPath(file.path, {userId, userToken, policy}, userData.logger)

      alpha.url = userFileStoreClient.getFetchUrl(userId, alpha.fingerprint)

      const omega = Object.assign({uuid: uuid.v4()}, file, alpha)

      const {
        fieldname,
        originalname
      } = omega

      const controlName = getUploadControlName(fieldname)
      const controlType = getUploadControlType(pageInstance, fieldname)

      /*
       *  To keep `fileupload` as-is
       */
      if (controlType === 'fileupload') {
        const was = userData.getUserDataProperty(controlName) || []

        const now = was.concat(omega)

        userData.setUserDataProperty(controlName, now)

        userData.setFlashMessage({
          type: 'file.uploaded',
          html: format(
            getString('flash.file.uploaded', userData.contentLang), {filename: originalname}, {lang: userData.contentLang}
          )
        })
      } else {
        /*
         *  Otherwise, for `upload`
         */
        const was = userData.getUserDataProperty(controlName) || []

        if (was.some(({fieldname: f}) => f === fieldname)) {
          was.splice(was.findIndex(({fieldname: f}) => f === fieldname), 1, omega)

          userData.setUserDataProperty(controlName, was)
        } else {
          const now = was.concat(omega)

          userData.setUserDataProperty(controlName, now)
        }
      }

      userData.setSuccessfulUpload(controlName) // what
    } catch (error) {
      fileErrors = fileErrors || {}
      fileErrors.UPLOAD_FAILED = fileErrors.UPLOAD_FAILED || []
      fileErrors.UPLOAD_FAILED.push({
        fieldname: file.fieldname,
        originalname: file.originalname,
        errorMessage: error.message,
        errorCode: error.code,
        errorType: error.constructor.name,
        maxSize: file.maxSize,
        size: file.size,
        type: file.type
      })
    }

    // get rid of temp file
    deleteFile(file.path)
  }
  return fileErrors
}

module.exports = storeUploadedFiles
