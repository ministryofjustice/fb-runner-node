const {getUploadMaxFiles, getUploadFileCount} = require('../utils/utils-uploads')

const getAllowedUploadControls = (userData, uploadControls) => {
  const alloweduploadControls = []
  uploadControls.forEach(uploadControl => {
    const uploadName = uploadControl.name
    const maxFiles = getUploadMaxFiles(uploadControl)
    const currentFiles = getUploadFileCount(uploadControl, userData)
    let allowable = maxFiles - currentFiles
    let uploadCount = 1
    while (allowable > 0) {
      alloweduploadControls.push({
        name: `${uploadName}[${uploadCount}]`,
        maxCount: 1
      })
      uploadCount++
      allowable--
    }
  })
  return alloweduploadControls
}

module.exports = getAllowedUploadControls
