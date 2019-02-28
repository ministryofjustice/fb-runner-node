const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getNormalisedUploadControlName} = require('../utils/utils')

const processUploadedFiles = async (processedResults, uploadControls) => {
  const files = deepClone(processedResults.files)
  let fileErrors = deepClone(processedResults.fileErrors)
  Object.keys(files).forEach(fieldname => {
    const file = files[fieldname][0]
    const realFieldName = getNormalisedUploadControlName(fieldname)
    const maxSize = uploadControls.filter(uploadControl => {
      return realFieldName === uploadControl.name
    }).map(uploadControl => uploadControl.maxSize)
    if (file.size > maxSize) {
      fileErrors = fileErrors || {}
      fileErrors.LIMIT_FILE_SIZE = fileErrors.LIMIT_FILE_SIZE || []
      const {originalname} = file
      fileErrors.LIMIT_FILE_SIZE.push({
        fieldname,
        originalname
      })
      delete files[fieldname]
    }
  })
  console.log('processedFiles', files)
  // Object.keys(files).forEach(fieldname => {
  //   const file = files[fieldname][0]
  //   const realFieldName = getRealControlName(fieldname)
  //   files[realFieldName] = files[realFieldName] || []
  //   files[realFieldName].push(file)
  //   delete files[fieldname]
  // })
  // files = files.filter(fieldname => !files[fieldname][0].oversize)

  return {files, fileErrors}
}

module.exports = processUploadedFiles
