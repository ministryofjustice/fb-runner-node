require('@ministryofjustice/module-alias/register-module')(module)

const {
  getComponentName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  getComponentFiles,
  setComponentFiles,
  getComponentMaxFiles,
  getComponentMinFiles,
  getComponentMaxSize,
  clearComponentFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const hasFieldName = ({ getBodyInput }) => Reflect.has(getBodyInput(), 'upload-component-field-name')
const getFieldName = ({ getBodyInput }) => Reflect.get(getBodyInput(), 'upload-component-field-name')

function processComponentFilesByFieldName (userData, files, fieldName, components) {
  if (!Reflect.has(files, fieldName)) {
    const componentName = getComponentName(fieldName)
    const component = components.find(({ name }) => componentName === name)

    const was = getComponentFiles(component, userData)

    const now = was.filter(({ fieldname }) => fieldname === fieldName)

    if (now.length) {
      setComponentFiles(component, now, userData)
    } else {
      clearComponentFiles(component, userData)
    }
  }
}

const mapComponentFilesToFieldName = (userData, files, components) => (fieldName) => processComponentFilesByFieldName(userData, files, fieldName, components)

module.exports = async function processComponentFiles (pageInstance, userData, { files, fileErrors = {} }, components, expectedControls = {}) {
  if (hasFieldName(userData)) {
    const fieldName = getFieldName(userData)

    if (Array.isArray(fieldName)) {
      fieldName.forEach(mapComponentFilesToFieldName(userData, files, components))
    } else {
      processComponentFilesByFieldName(userData, files, fieldName, components)
    }
  }

  Object.entries(files)
    /**
     *  The field key is `fieldName`
     *  The field value is an array, and `file` is its first item
     */
    .forEach(([fieldName, [file]], index) => {
      const componentName = getComponentName(fieldName)
      const component = components.find(({ name }) => componentName === name)

      const maxFiles = getComponentMaxFiles(component)
      const minFiles = getComponentMinFiles(component)
      const maxSize = getComponentMaxSize(component)

      const {
        validation: {
          accept
        } = {},
        expires
      } = component

      file.maxFiles = maxFiles
      file.minFiles = minFiles
      file.maxSize = maxSize
      file.expires = expires
      file.allowed_types = accept

      if (file.size > maxSize) {
        const {
          maxSize = []
        } = fileErrors

        /*
         *  `fileErrors.maxSize` is a list of files
         *  whose `size` exceeds the `maxSize` value
         */
        fileErrors.maxSize = maxSize.concat({
          ...file,
          fieldname: fieldName
        })

        delete files[fieldName]
      }
    })

  return { files, fileErrors }
}
