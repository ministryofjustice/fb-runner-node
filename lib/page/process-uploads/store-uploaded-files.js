const {getNormalisedUploadControlName} = require('../utils/utils-controls')
const fs = require('fs')
const uuid = require('uuid')

const FBUserFileStoreClient = require('../../client/user-filestore/user-filestore')

const storeUploadedFiles = async (userData, uploadedResults) => {
  let {files, fileErrors} = uploadedResults

  const filePromises = Object.keys(files).map(fieldname => {
    return FBUserFileStoreClient.store(files[fieldname][0])
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
        const {fieldname, originalname} = file
        const realFieldName = getNormalisedUploadControlName(fieldname)
        let filesArray = userData.getUserDataProperty(realFieldName) || []
        filesArray = filesArray.slice()
        filesArray.push(data)
        userData.setUserDataProperty(realFieldName, filesArray)
        // TODO: set flash value for file
        userData.setFlashMessage({
          type: 'upload',
          html: `Uploaded ${originalname}`
        })
        userData.setSuccessfulUpload(realFieldName)
      }
      fs.unlink(file.path, () => {})
    })
    return fileErrors
  })
}

module.exports = storeUploadedFiles
