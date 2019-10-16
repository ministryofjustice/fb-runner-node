const {getNormalisedUploadControlName} = require('../utils/utils-controls')
const fs = require('fs')
const uuid = require('uuid')

const {getString} = require('../../service-data/service-data')
const {format} = require('../../format/format')

const userFileStoreClient = require('../../client/user-filestore/user-filestore')

const deleteFile = (filepath) => {
  fs.unlink(filepath, () => {})
}

const storeUploadedFiles = async (userData, uploadedResults) => {
  let {files, fileErrors} = uploadedResults

  // TODO: never process the file in the removed slot in the first place
  const {removeSlot} = userData.getBodyInput()
  if (removeSlot && files[removeSlot]) {
    const removeSlotFile = files[removeSlot][0]
    delete files[removeSlot]
    deleteFile(removeSlotFile.path)
  }

  const userId = userData.getUserId()
  const userToken = userData.getUserToken()

  const fileList = Object.keys(files).map(fieldname => files[fieldname][0])
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
      const result = await userFileStoreClient.storeFromPath(file.path, {userId, userToken, policy}, userData.logger)
      result.url = userFileStoreClient.getFetchUrl(userId, result.fingerprint)
      const data = Object.assign({}, file, result)
      data.uuid = uuid.v4()
      const {fieldname, originalname} = data
      const realFieldName = getNormalisedUploadControlName(fieldname)
      let filesArray = userData.getUserDataProperty(realFieldName) || []
      filesArray = filesArray.slice()
      filesArray.push(data)
      userData.setUserDataProperty(realFieldName, filesArray)
      let uploadMessage = getString('flash.file.uploaded', userData.contentLang)
      uploadMessage = format(uploadMessage, {filename: originalname}, {lang: userData.contentLang})
      userData.setFlashMessage({
        type: 'file.uploaded',
        html: uploadMessage
      })
      userData.setSuccessfulUpload(realFieldName)
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
