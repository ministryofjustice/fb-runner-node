const jsonPath = require('jsonpath')

const {
  getUploadControlName
} = require('./utils-controls')

const getUploadControls = (pageInstance) => jsonPath.query(pageInstance, '$..[?(@._type === "fileupload"||@._type === "upload")]')

const getComponentMaxFiles = ({maxFiles}) => maxFiles || 1 // not zero

const getComponentMinFiles = ({minFiles = 1}) => minFiles // possibly zero, not undefined

const getComponentMaxFilesForUploadControls = (pageInstance) => getUploadControls(pageInstance).reduce((max, component) => Math.max(max, getComponentMaxFiles(component)), 0)

const getComponentMinFilesForUploadControls = (pageInstance) => getUploadControls(pageInstance).reduce((min, component) => Math.max(min, getComponentMinFiles(component)), 0) // Math.max!

const getUploadedMaxFiles = (...args) => getComponentMaxFiles(...args)

const getUploadedMinFiles = (...args) => getComponentMinFiles(...args)

const hasUploadedMaxFiles = (component, userData) => getUploadedFileCount(component, userData) === getComponentMaxFiles(component)

const hasUploadedMinFiles = (component, userData) => getUploadedFileCount(component, userData) >= getComponentMinFiles(component)

const getUploadedMaxSize = ({validation: {maxSize} = {}}) => maxSize

const getUploadedFiles = ({name}, {getUserDataProperty}) => getUserDataProperty(name) || []

const setUploadedFiles = ({name}, files = [], {setUserDataProperty}) => setUserDataProperty(name, files)

const getUploadedFileCount = (...args) => getUploadedFiles(...args).length

const clearUploadedFiles = ({name}, {unsetUserDataProperty}) => unsetUserDataProperty(name)

const getUploadedMaxFilesForUploadControls = (...args) => getComponentMaxFilesForUploadControls(...args)

const getUploadedMinFilesForUploadControls = (...args) => getComponentMinFilesForUploadControls(...args)

const hasUploadControlsMaxFiles = (pageInstance, userData) => getUploadControls(pageInstance).every((component) => hasUploadedMaxFiles(component, userData))

const hasUploadControlsMinFiles = (pageInstance, userData) => getUploadControls(pageInstance).every((component) => hasUploadedMinFiles(component, userData))

function getAcceptedFiles ({name}, {getUserData}) {
  const {
    accepted = []
  } = getUserData()

  return accepted
    .filter(({fieldname = '', fieldName = fieldname}) => getUploadControlName(fieldName) === name)
}

const getAcceptedFileCount = (...args) => getAcceptedFiles(...args).length

const getAcceptedMaxFiles = (...args) => getComponentMaxFiles(...args)

const getAcceptedMinFiles = (...args) => getComponentMinFiles(...args)

const hasAcceptedMaxFiles = (component, userData) => getAcceptedFileCount(component, userData) === getComponentMaxFiles(component)

const hasAcceptedMinFiles = (component, userData) => getAcceptedFileCount(component, userData) >= getComponentMinFiles(component)

const getAcceptedMaxFilesForUploadControls = (...args) => getComponentMaxFilesForUploadControls(...args)

const getAcceptedMinFilesForUploadControls = (...args) => getComponentMinFilesForUploadControls(...args)

const hasAcceptedMaxFilesForUploadControls = (pageInstance, userData) => getUploadControls(pageInstance).every((component) => hasAcceptedMaxFiles(component, userData))

const hasAcceptedMinFilesForUploadControls = (pageInstance, userData) => getUploadControls(pageInstance).every((component) => hasAcceptedMinFiles(component, userData))

const addToAcceptedFiles = ({getUserData, setUserDataProperty}, {fieldname, fieldName = fieldname, ...file}) => {
  const {accepted = []} = getUserData()

  if (accepted.some(({fieldName: accepted}) => accepted === fieldName)) accepted.splice(accepted.findIndex(({fieldName: accepted}) => accepted === fieldName), 1)

  setUserDataProperty('accepted', accepted.concat({...file, fieldName}))
}

const removeFromAcceptedFiles = ({getUserData, setUserDataProperty}, {fieldname, fieldName = fieldname}) => {
  const {accepted = []} = getUserData()

  if (accepted.some(({fieldName: accepted}) => accepted === fieldName)) accepted.splice(accepted.findIndex(({fieldName: accepted}) => accepted === fieldName), 1)

  setUserDataProperty('accepted', accepted)
}

const hasAcceptedFile = ({getUserData}, fieldName) => {
  const {accepted = []} = getUserData()

  return accepted.some(({fieldName: accepted}) => accepted === fieldName)
}

const getAcceptedFile = ({getUserData}, fieldName) => {
  const {accepted = []} = getUserData()

  return accepted.find(({fieldName: accepted}) => accepted === fieldName)
}

const hasAcceptedFileByUUID = ({getUserData}, uuid) => {
  const {accepted = []} = getUserData()

  return accepted.some(({uuid: accepted}) => accepted === uuid)
}

const getAcceptedFileByUUID = ({getUserData}, uuid) => {
  const {accepted = []} = getUserData()

  return accepted.find(({uuid: accepted}) => accepted === uuid)
}

module.exports = {
  getUploadControls,
  getUploadedMaxFiles,
  getUploadedMinFiles,
  hasUploadedMaxFiles,
  hasUploadedMinFiles,
  getUploadedMaxSize,
  getUploadedFiles,
  setUploadedFiles,
  getUploadedFileCount,
  clearUploadedFiles,
  getUploadedMaxFilesForUploadControls,
  getUploadedMinFilesForUploadControls,
  hasUploadControlsMaxFiles,
  hasUploadControlsMinFiles,
  getAcceptedFiles,
  getAcceptedFileCount,
  getAcceptedMaxFiles,
  getAcceptedMinFiles,
  hasAcceptedMaxFiles,
  hasAcceptedMinFiles,
  getAcceptedMaxFilesForUploadControls,
  getAcceptedMinFilesForUploadControls,
  hasAcceptedMaxFilesForUploadControls,
  hasAcceptedMinFilesForUploadControls,
  addToAcceptedFiles,
  removeFromAcceptedFiles,
  hasAcceptedFile,
  getAcceptedFile,
  hasAcceptedFileByUUID,
  getAcceptedFileByUUID
}
