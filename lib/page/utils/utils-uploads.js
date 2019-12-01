const jsonPath = require('jsonpath')

const getUploadControls = pageInstance => jsonPath.query(pageInstance, '$..[?(@._type === "fileupload"||@._type === "mojUpload")]')

const getUploadMaxFiles = ({maxFiles}) => maxFiles || 1 // not zero

const getUploadMinFiles = ({minFiles = 1}) => minFiles // possibly zero, not undefined

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
