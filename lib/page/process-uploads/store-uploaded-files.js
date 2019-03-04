const {getNormalisedUploadControlName} = require('../utils/utils')
const fs = require('fs')

const FBUserFileStoreClient = require('../../client/user-filestore/user-filestore')

const storeUploadedFiles = async (userData, uploadedResults) => {
  let {files, fileErrors} = uploadedResults

  const filePromises = Object.keys(files).map(fieldname => {
    return FBUserFileStoreClient.save(files[fieldname][0])
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
        const {fieldname} = file
        const realFieldName = getNormalisedUploadControlName(fieldname)
        let filesArray = userData.getUserDataProperty(realFieldName) || []
        filesArray = filesArray.slice()
        filesArray.push(data)
        userData.setUserDataProperty(realFieldName, filesArray)
        // TODO: set flash value for file
      }
      fs.unlink(file.path, () => {})
    })
    return fileErrors
  })
}

module.exports = storeUploadedFiles
