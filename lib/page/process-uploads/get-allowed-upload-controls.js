require('@ministryofjustice/module-alias/register-module')(module)

const {
  getUploadedMaxFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  getUploadFieldName
} = require('~/fb-runner-node/page/utils/utils-controls')

module.exports = function getAllowedUploadControls (uploadControls) {
  return uploadControls.reduce((accumulator, control) => {
    const {
      name
    } = control

    const maxFiles = getUploadedMaxFiles(control)
    let count = 1
    const limit = maxFiles + 1

    while (count < limit) {
      accumulator.push({
        name: getUploadFieldName(name, count),
        maxCount: 1
      })

      count++
    }

    return accumulator
  }, [])
}
