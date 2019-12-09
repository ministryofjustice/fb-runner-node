const jsonPath = require('jsonpath')

const getUploadControls = (pageInstance) => jsonPath.query(pageInstance, '$..[?(@._type === "fileupload"||@._type === "upload")]')

const getUploadMaxFiles = ({maxFiles}) => maxFiles || 1 // not zero

const getUploadMinFiles = ({minFiles = 1}) => minFiles // possibly zero, not undefined

const getUploadMaxSize = ({validation: {maxSize} = {}}) => maxSize

const getUploadFiles = ({name}, {getUserDataProperty}) => getUserDataProperty(name) || []

const setUploadFiles = ({name}, files = [], {setUserDataProperty}) => setUserDataProperty(name, files)

const getUploadFileCount = (control, userData) => getUploadFiles(control, userData).length

const clearUploadFiles = ({name}, {unsetUserDataProperty}) => unsetUserDataProperty(name)

module.exports = {
  getUploadControls,
  getUploadMaxFiles,
  getUploadMinFiles,
  getUploadMaxSize,
  getUploadFiles,
  setUploadFiles,
  getUploadFileCount,
  clearUploadFiles
}
