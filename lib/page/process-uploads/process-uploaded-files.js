require('@ministryofjustice/module-alias/register-module')(module)

const {
  getUploadControlName
} = require('~/fb-runner-node/page/utils/utils-controls')

const {
  getUploadFiles,
  setUploadFiles,
  clearUploadFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const hasFileName = ({getBodyInput}) => Reflect.has(getBodyInput(), 'fileName')
const getFileName = ({getBodyInput}) => Reflect.get(getBodyInput(), 'fileName')

module.exports = async function processUploadedFiles ({files, fileErrors = {}}, pageInstance, userData, uploadControls, expectedControls = {}) {
  if (hasFileName(userData)) {
    const fileName = getFileName(userData)

    if (!Reflect.has(files, fileName)) {
      const controlName = getUploadControlName(fileName)
      const control = uploadControls.find(({name}) => controlName === name)

      const was = getUploadFiles(control, userData)

      const now = was.filter(({fieldname}) => fieldname === fileName)

      if (now.length) {
        setUploadFiles(control, now, userData)
      } else {
        clearUploadFiles(control, userData)
      }
    }
  }

  Object.entries(files)
    /**
     *  The field key is `fileName`
     *  The field value is an array, and `file` is its first item
     */
    .forEach(([fileName, [file]]) => {
      const controlName = getUploadControlName(fileName)
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
          fieldname: fileName
        })

        delete files[fileName]
      }
    })

  return {files, fileErrors}
}
