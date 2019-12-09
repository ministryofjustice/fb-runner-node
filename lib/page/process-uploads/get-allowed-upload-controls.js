require('@ministryofjustice/module-alias/register-module')(module)

const {
  getUploadMaxFiles
} = require('~/fb-runner-node/page/utils/utils-uploads')

const getAllowedUploadControls = (userData, uploadControls) => {
  const allowedUploadControls = []

  uploadControls.forEach((control) => {
    const {
      name
    } = control

    const maxFiles = getUploadMaxFiles(control)
    let count = 1
    const limit = maxFiles + 1
    while (count < limit) {
      allowedUploadControls.push({
        name: `${name}[${count}]`,
        maxCount: 1
      })

      count++
    }
  })

  return allowedUploadControls
}

module.exports = getAllowedUploadControls
