require('@ministryofjustice/module-alias/register-module')(module)

const {
  getUploadControlName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  getUploadFiles,
  setUploadFiles,
  getUploadMaxFiles,
  getUploadMinFiles,
  getUploadMaxSize,
  clearUploadFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const hasFieldName = ({getBodyInput}) => Reflect.has(getBodyInput(), 'fieldName')
const getFieldName = ({getBodyInput}) => Reflect.get(getBodyInput(), 'fieldName')

function processUploadedFilesForFieldName (userData, files, fieldName, uploadControls) {
  if (!Reflect.has(files, fieldName)) {
    const controlName = getUploadControlName(fieldName)
    const control = uploadControls.find(({name}) => controlName === name)

    const was = getUploadFiles(control, userData)

    const now = was.filter(({fieldname}) => fieldname === fieldName)

    if (now.length) {
      setUploadFiles(control, now, userData)
    } else {
      clearUploadFiles(control, userData)
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
      const controlName = getUploadControlName(fieldName)
      const control = uploadControls.find(({name}) => controlName === name)

      const maxFiles = getUploadMaxFiles(control)
      const minFiles = getUploadMinFiles(control)
      const maxSize = getUploadMaxSize(control)

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
