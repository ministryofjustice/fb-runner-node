const {getUploadControls} = require('../utils/utils')

const getAllowedUploadControls = require('./get-allowed-upload-controls')
const processUploadControls = require('./process-upload-controls')
const processUploadedFiles = require('./process-uploaded-files')
const registerUploadErrors = require('./register-upload-errors')
const storeUploadedFiles = require('./store-uploaded-files')

const processUploads = async (pageInstance, userData) => {
  const {req} = userData
  if (pageInstance.encType && req.method === 'POST') {
    let uploadControls = getUploadControls(pageInstance)

    const allowedUploadControls = getAllowedUploadControls(userData, uploadControls)
    const processedResults = await processUploadControls(userData, uploadControls, allowedUploadControls)
    let uploadResults = await processUploadedFiles(processedResults, uploadControls)
    const fileErrors = await storeUploadedFiles(userData, uploadResults)
    registerUploadErrors(fileErrors)
  }
  return pageInstance
}

module.exports = processUploads
