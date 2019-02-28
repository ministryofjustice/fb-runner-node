const getAllowedUploadControls = (userData, uploadControls) => {
  const alloweduploadControls = []
  uploadControls.forEach(uploadControl => {
    const uploadName = uploadControl.name
    const maxFiles = uploadControl.maxFiles || 1
    const currentUploads = userData.getUserDataProperty(uploadName)
    const currentFiles = currentUploads ? currentUploads.length : 0
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
