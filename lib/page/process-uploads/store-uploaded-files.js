const {getNormalisedUploadControlName} = require('../utils/utils-controls')
const fs = require('fs')
const uuid = require('uuid')

const {getString} = require('../../service-data/service-data')
const {format} = require('../../format/format')

const FBUserFileStoreClient = require('../../client/user-filestore/user-filestore')

const storeUploadedFiles = async (userData, uploadedResults) => {
  let {files, fileErrors} = uploadedResults

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
        return Object.assign({}, {file}, result)
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
          errorType: error.constructor.name
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
        // TODO: set flash value for file
        let uploadMessage = getString('fileupload.flash.success', userData.contentLang)
        uploadMessage = format(uploadMessage, {filename: originalname})
        userData.setFlashMessage({
          type: 'upload',
          html: uploadMessage
        })
        userData.setSuccessfulUpload(realFieldName)
      }
      fs.unlink(file.path, () => {})
    })
    return fileErrors
  })
}

module.exports = storeUploadedFiles
