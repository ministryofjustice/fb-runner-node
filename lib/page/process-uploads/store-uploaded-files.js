const {getNormalisedUploadControlName} = require('../utils/utils-controls')
const fs = require('fs')
const uuid = require('uuid')

const {getString} = require('../../service-data/service-data')
const {format} = require('../../format/format')

const FBUserFileStoreClient = require('../../client/user-filestore/user-filestore')

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

  const {userId, userToken} = userData
  const filePromises = Object.keys(files).map(fieldname => {
    const file = files[fieldname][0]
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
    return FBUserFileStoreClient.storeFromPath(userId, userToken, file.path, policy)
      .then(result => {
        if (!result.error) {
          result.url = FBUserFileStoreClient.getFetchUrl(userId, result.fingerprint)
          result = {value: result}
        }
        return Object.assign({file}, result)
      })
      .catch(err => {
        return Object.assign({file}, err)
      })
  })

  return Promise.all(filePromises).then((results) => {
    results.forEach(result => {
      let {file, error, value} = result
      if (error) {
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
      } else {
        const data = Object.assign({}, file, value)
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
      }
      deleteFile(file.path)
    })
    return fileErrors
  })
}

module.exports = storeUploadedFiles
