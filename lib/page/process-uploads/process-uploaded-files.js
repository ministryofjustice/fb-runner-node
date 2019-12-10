require('@ministryofjustice/module-alias/register-module')(module)

const {
  getUploadControlName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  getUploadFiles,
  setUploadFiles,
  clearUploadFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const hasFieldName = ({getBodyInput}) => Reflect.has(getBodyInput(), 'fieldName')
const getFieldName = ({getBodyInput}) => Reflect.get(getBodyInput(), 'fieldName')

function processUploadedFilesForFieldName (files, userData, uploadControls, fieldName) {
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

const mapUploadedFilesToFieldName = (files, userData, uploadControls) => (fieldName) => processUploadedFilesForFieldName(files, userData, uploadControls, fieldName)

module.exports = async function processUploadedFiles ({files, fileErrors = {}}, pageInstance, userData, uploadControls, expectedControls = {}) {
  if (hasFieldName(userData)) {
    const fieldName = getFieldName(userData)

    if (Array.isArray(fieldName)) {
      fieldName.forEach(mapUploadedFilesToFieldName(files, userData, uploadControls))
    } else {
      processUploadedFilesForFieldName(files, userData, uploadControls, fieldName)
    }
  }

  Object.entries(files)
    /**
     *  The field key is `fieldName`
     *  The field value is an array, and `file` is its first item
     */
    .forEach(([fieldName, [file]]) => {
      const controlName = getUploadControlName(fieldName)
      const control = uploadControls.find(({name}) => controlName === name)

      const {
        validation: {
          maxSize,
          accept
        } = {},
        expires
      } = control

      file.maxSize = maxSize
      file.expires = expires
      file.allowed_types = accept

      if (file.size > maxSize) {
        fileErrors.maxSize = fileErrors.maxSize || []
        /**
         *  `fileErrors.maxSize` is a list of files
         *  whose `size` exceeds the `maxSize` value
         */
        fileErrors.maxSize.push({
          ...file,
          fieldname: fieldName
        })

        delete files[fieldName]
      }
    })

  return {files, fileErrors}
}
