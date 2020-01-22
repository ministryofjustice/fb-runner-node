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

const hasFieldName = ({getBodyInput}) => Reflect.has(getBodyInput(), 'fieldName')
const getFieldName = ({getBodyInput}) => Reflect.get(getBodyInput(), 'fieldName')

function processUploadedFilesForFieldName (userData, files, fieldName, uploadControls) {
  if (!Reflect.has(files, fieldName)) {
    const controlName = getComponentName(fieldName)
    const control = uploadControls.find(({name}) => controlName === name)

    const was = getComponentFiles(control, userData)

    const now = was.filter(({fieldname}) => fieldname === fieldName)

    if (now.length) {
      setComponentFiles(control, now, userData)
    } else {
      clearComponentFiles(control, userData)
    }
  }
}

const mapUploadedFilesToFieldName = (userData, files, uploadControls) => (fieldName) => processUploadedFilesForFieldName(userData, files, fieldName, uploadControls)

module.exports = async function processUploadedFiles (pageInstance, userData, {files, fileErrors = {}}, uploadControls, expectedControls = {}) {
  if (hasFieldName(userData)) {
    const fieldName = getFieldName(userData)

    if (Array.isArray(fieldName)) {
      fieldName.forEach(mapUploadedFilesToFieldName(userData, files, uploadControls))
    } else {
      processUploadedFilesForFieldName(userData, files, fieldName, uploadControls)
    }
  }

  Object.entries(files)
    /**
     *  The field key is `fieldName`
     *  The field value is an array, and `file` is its first item
     */
    .forEach(([fieldName, [file]], index) => {
      const controlName = getComponentName(fieldName)
      const control = uploadControls.find(({name}) => controlName === name)

      const maxFiles = getComponentMaxFiles(control)
      const minFiles = getComponentMinFiles(control)
      const maxSize = getComponentMaxSize(control)

      const {
        validation: {
          accept
        } = {},
        expires
      } = control

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

  return {files, fileErrors}
}
