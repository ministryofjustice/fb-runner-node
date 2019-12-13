const jsonPath = require('jsonpath')

const getUploadControls = (pageInstance) => jsonPath.query(pageInstance, '$..[?(@._type === "fileupload"||@._type === "upload")]')

const getUploadMaxFiles = ({maxFiles}) => maxFiles || 1 // not zero

const getUploadMinFiles = ({minFiles = 1}) => minFiles // possibly zero, not undefined

const hasUploadMaxFiles = (component, userData) => getUploadFileCount(component, userData) === getUploadMaxFiles(component)

const hasUploadMinFiles = (component, userData) => getUploadFileCount(component, userData) >= getUploadMinFiles(component)

const getUploadMaxSize = ({validation: {maxSize} = {}}) => maxSize

const getUploadFiles = ({name}, {getUserDataProperty}) => getUserDataProperty(name) || []

const setUploadFiles = ({name}, files = [], {setUserDataProperty}) => setUserDataProperty(name, files)

const getUploadFileCount = (control, userData) => getUploadFiles(control, userData).length

const clearUploadFiles = ({name}, {unsetUserDataProperty}) => unsetUserDataProperty(name)

const getUploadControlsMaxFiles = (pageInstance) => getUploadControls(pageInstance).reduce((max, component) => Math.max(max, getUploadMaxFiles(component)), 0)

const getUploadControlsMinFiles = (pageInstance) => getUploadControls(pageInstance).reduce((min, component) => Math.max(min, getUploadMinFiles(component)), 0) // Math.max!

const hasUploadControlsMaxFiles = (pageInstance, userData) => getUploadControls(pageInstance).every((component) => hasUploadMaxFiles(component, userData))

const hasUploadControlsMinFiles = (pageInstance, userData) => getUploadControls(pageInstance).every((component) => hasUploadMinFiles(component, userData))

const addToAcceptedFiles = (userData, {fieldname, fieldName = fieldname, ...file}) => {
  const accepted = userData.getUserDataProperty('accepted') || []

  if (accepted.some(({fieldName: accepted}) => accepted === fieldName)) accepted.splice(accepted.findIndex(({fieldName: accepted}) => accepted === fieldName), 1)

  userData.setUserDataProperty('accepted', accepted.concat({...file, fieldName}))
}

const removeFromAcceptedFiles = (userData, {fieldname, fieldName = fieldname}) => {
  const accepted = userData.getUserDataProperty('accepted') || []

  if (accepted.some(({fieldName: accepted}) => accepted === fieldName)) accepted.splice(accepted.findIndex(({fieldName: accepted}) => accepted === fieldName), 1)

  userData.setUserDataProperty('accepted', accepted)
}

const hasAcceptedFile = (userData, fieldName) => {
  const accepted = userData.getUserDataProperty('accepted') || []

  return accepted.some(({fieldName: accepted}) => accepted === fieldName)
}

const getAcceptedFile = (userData, fieldName) => {
  const accepted = userData.getUserDataProperty('accepted') || []

  return accepted.find(({fieldName: accepted}) => accepted === fieldName)
}

module.exports = {
  getUploadControls,
  getUploadMaxFiles,
  getUploadMinFiles,
  hasUploadMaxFiles,
  hasUploadMinFiles,
  getUploadMaxSize,
  getUploadFiles,
  setUploadFiles,
  getUploadFileCount,
  clearUploadFiles,
  getUploadControlsMaxFiles,
  getUploadControlsMinFiles,
  hasUploadControlsMaxFiles,
  hasUploadControlsMinFiles,
  addToAcceptedFiles,
  removeFromAcceptedFiles,
  hasAcceptedFile,
  getAcceptedFile
}
