require('@ministryofjustice/module-alias/register-module')(module)

const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getNormalisedUploadControlName} = require('~/fb-runner-node/page/utils/utils-controls')

module.exports = async function processMojUploadedFiles (processedResults, uploadControls) {
  const files = deepClone(processedResults.files)
  const fileErrors = deepClone(processedResults.fileErrors) || {}

  Object.entries(files)
    /**
     *  The field key is `controlName`
     *  The field value is an array, and `file` is its first item
     */
    .forEach(([controlName, [file]]) => {
      const normalisedControlName = getNormalisedUploadControlName(controlName)
      const control = uploadControls.find(({name}) => normalisedControlName === name)
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
          fieldname: controlName
        })

        delete files[controlName]
      }
    })

  return {files, fileErrors}
}
