const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getNormalisedUploadControlName} = require('../utils/utils-controls')

const processUploadedFiles = async (processedResults, uploadControls) => {
  const files = deepClone(processedResults.files)
  let fileErrors = deepClone(processedResults.fileErrors)
  Object.keys(files)
    .forEach(fieldname => {
      const file = files[fieldname][0]
      const realFieldName = getNormalisedUploadControlName(fieldname)
      const maxSize = (
        uploadControls
          .filter(uploadControl => {
            return realFieldName === uploadControl.name
          })
          .map(({ validation = {}, expires, accept }) => {
            file.maxSize = validation.maxSize
            file.expires = expires
            file.allowed_types = accept
            return validation.maxSize
          })[0]
      )

      if (file.size > maxSize) {
        fileErrors = fileErrors || {}
        fileErrors.maxSize = fileErrors.maxSize || []
        const {originalname} = file
        fileErrors.maxSize.push({
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
