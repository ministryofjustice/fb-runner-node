const jsonPath = require('jsonpath')

const {
  getComponentName
} = require('./utils-controls')

/*
 *  'components'
 */

const getComponents = (pageInstance) => jsonPath.query(pageInstance, '$..[?(@._type === "upload")]')

const getComponentsMaxFiles = (pageInstance) => getComponents(pageInstance).reduce((max, component) => Math.max(max, getComponentMaxFiles(component)), 0)

const getComponentsMinFiles = (pageInstance) => getComponents(pageInstance).reduce((min, component) => Math.max(min, getComponentMinFiles(component)), 0) // Math.max!

const hasComponentsMaxFiles = (pageInstance, userData) => getComponents(pageInstance).every((component) => hasComponentMaxFiles(component, userData))

const hasComponentsMinFiles = (pageInstance, userData) => getComponents(pageInstance).every((component) => hasComponentMinFiles(component, userData))

/*
 *  'component'
 */

const getComponentMaxFiles = ({ maxFiles }) => maxFiles || 1 // not zero

const getComponentMinFiles = ({ minFiles = 1 }) => minFiles // possibly zero, not undefined

const hasComponentMaxFiles = (component, userData) => countComponentFiles(component, userData) === getComponentMaxFiles(component)

const hasComponentMinFiles = (component, userData) => countComponentFiles(component, userData) >= getComponentMinFiles(component)

const getComponentMaxSize = ({ validation: { maxSize } = {} }) => maxSize

const getComponentFiles = ({ name }, { getUserDataProperty }) => {
  const files = getUserDataProperty(name)

  return Array.isArray(files) ? files : []
}

const setComponentFiles = ({ name }, files = [], { setUserDataProperty }) => {
  if (Array.isArray(files)) setUserDataProperty(name, files)
}

const countComponentFiles = (...args) => getComponentFiles(...args).length

const clearComponentFiles = ({ name }, { unsetUserDataProperty }) => unsetUserDataProperty(name)

/*
 *  'accepted'
 */

function getComponentAcceptedFiles ({ name }, { getUserData }) {
  const {
    'upload-component-accepted': accepted = []
  } = getUserData()

  return accepted
    .filter(({ fieldname = '', fieldName = fieldname }) => getComponentName(fieldName) === name)
}

const countComponentAcceptedFiles = (...args) => getComponentAcceptedFiles(...args).length

const getComponentAcceptedMaxFiles = (...args) => getComponentMaxFiles(...args)

const getComponentAcceptedMinFiles = (...args) => getComponentMinFiles(...args)

const hasComponentAcceptedMaxFiles = (component, userData) => countComponentAcceptedFiles(component, userData) === getComponentMaxFiles(component)

const hasComponentAcceptedMinFiles = (component, userData) => countComponentAcceptedFiles(component, userData) >= getComponentMinFiles(component)

const hasComponentAcceptedAnyFiles = (component, userData) => !!countComponentAcceptedFiles(component, userData)

const getComponentsAcceptedMaxFiles = (...args) => getComponentsMaxFiles(...args)

const getComponentsAcceptedMinFiles = (...args) => getComponentsMinFiles(...args)

const hasComponentsAcceptedMaxFiles = (pageInstance, userData) => getComponents(pageInstance).every((component) => hasComponentAcceptedMaxFiles(component, userData))

const hasComponentsAcceptedMinFiles = (pageInstance, userData) => getComponents(pageInstance).every((component) => hasComponentAcceptedMinFiles(component, userData))

function addToComponentAcceptedFiles ({ getUserData, setUserDataProperty }, { fieldname, fieldName = fieldname, ...file }) {
  const { 'upload-component-accepted': accepted = [] } = getUserData()

  if (accepted.some(({ fieldName: accepted }) => accepted === fieldName)) accepted.splice(accepted.findIndex(({ fieldName: accepted }) => accepted === fieldName), 1)

  setUserDataProperty('upload-component-accepted', accepted.concat({ ...file, fieldName }))
}

function removeFromComponentAcceptedFiles ({ getUserData, setUserDataProperty }, { fieldname, fieldName = fieldname }) {
  const { 'upload-component-accepted': accepted = [] } = getUserData()

  if (accepted.some(({ fieldName: accepted }) => accepted === fieldName)) accepted.splice(accepted.findIndex(({ fieldName: accepted }) => accepted === fieldName), 1)

  setUserDataProperty('upload-component-accepted', accepted)
}

function hasComponentAcceptedFile ({ getUserData }, fieldName) {
  const { 'upload-component-accepted': accepted = [] } = getUserData()

  return accepted.some(({ fieldName: accepted }) => accepted === fieldName)
}

function getComponentAcceptedFile ({ getUserData }, fieldName) {
  const { 'upload-component-accepted': accepted = [] } = getUserData()

  return accepted.find(({ fieldName: accepted }) => accepted === fieldName)
}

function hasComponentAcceptedFileByUUID ({ getUserData }, uuid) {
  const { 'upload-component-accepted': accepted = [] } = getUserData()

  return accepted.some(({ uuid: accepted }) => accepted === uuid)
}

function getComponentAcceptedFileByUUID ({ getUserData }, uuid) {
  const { 'upload-component-accepted': accepted = [] } = getUserData()

  return accepted.find(({ uuid: accepted }) => accepted === uuid)
}

module.exports = {
  getComponents,
  getComponentMaxFiles,
  getComponentMinFiles,
  hasComponentMaxFiles,
  hasComponentMinFiles,
  getComponentMaxSize,
  getComponentFiles,
  setComponentFiles,
  countComponentFiles,
  clearComponentFiles,
  getComponentsMaxFiles,
  getComponentsMinFiles,
  hasComponentsMaxFiles,
  hasComponentsMinFiles,
  getComponentAcceptedFiles,
  countComponentAcceptedFiles,
  getComponentAcceptedMaxFiles,
  getComponentAcceptedMinFiles,
  hasComponentAcceptedMaxFiles,
  hasComponentAcceptedMinFiles,
  hasComponentAcceptedAnyFiles,
  getComponentsAcceptedMaxFiles,
  getComponentsAcceptedMinFiles,
  hasComponentsAcceptedMaxFiles,
  hasComponentsAcceptedMinFiles,
  addToComponentAcceptedFiles,
  removeFromComponentAcceptedFiles,
  hasComponentAcceptedFile,
  getComponentAcceptedFile,
  hasComponentAcceptedFileByUUID,
  getComponentAcceptedFileByUUID
}
