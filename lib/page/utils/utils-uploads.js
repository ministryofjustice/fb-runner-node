const jp = require('jsonpath')

const getUploadControls = pageInstance => jp.query(pageInstance, '$..[?(@._type === "fileupload")]')

const getUploadMaxFiles = control => {
  return control.maxFiles || 1
}

const getUploadMinFiles = control => {
  let minFiles = control.minFiles
  if (minFiles === undefined) {
    // TODO: handle optional case
    minFiles = 1
  }
  return minFiles
}

const getUploadFileCount = (control, userData) => {
  const currentUploads = getUploadFiles(control, userData)
  return currentUploads ? currentUploads.length : 0
}

const getUploadFiles = (control, userData) => {
  const uploadName = control.name
  return userData.getUserDataProperty(uploadName) || []
}

module.exports = {
  getUploadControls,
  getUploadMaxFiles,
  getUploadMinFiles,
  getUploadFiles,
  getUploadFileCount
}
