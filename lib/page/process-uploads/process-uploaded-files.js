const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getNormalisedUploadControlName} = require('../utils/utils-controls')

const processUploadedFiles = async (processedResults, uploadControls) => {
  const files = deepClone(processedResults.files)
  let fileErrors = deepClone(processedResults.fileErrors)
  Object.keys(files).forEach(fieldname => {
    const file = files[fieldname][0]
    const realFieldName = getNormalisedUploadControlName(fieldname)
    const maxSize = uploadControls.filter(uploadControl => {
      return realFieldName === uploadControl.name
    }).map(uploadControl => {
      file.maxSize = uploadControl.maxSize
      file.expires = uploadControl.expires
      file.allowed_types = uploadControl.allowed_types
      return uploadControl.maxSize
    })[0]

    if (file.size > maxSize) {
      fileErrors = fileErrors || {}
      fileErrors.LIMIT_FILE_SIZE = fileErrors.LIMIT_FILE_SIZE || []
      const {originalname} = file
      fileErrors.LIMIT_FILE_SIZE.push({
        fieldname,
        originalname,
        maxSize,
        size: file.size
      })
      delete files[fieldname]
    }
  })

  return {files, fileErrors}
}

module.exports = processUploadedFiles
