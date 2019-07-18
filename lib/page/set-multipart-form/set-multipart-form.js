const {getUploadControls} = require('../utils/utils-uploads')
const setUploadControlsMaxSize = require('./set-upload-controls-max-size')

const setMultipartForm = async (pageInstance, userData) => {
  let uploadControls = getUploadControls(pageInstance)
  const encType = !!uploadControls.length
  const {req} = userData
  if (req.method === 'POST') {
    const contentType = req.get('content-type')
    if (encType) {
      if (!contentType || !contentType.startsWith('multipart/form-data;')) {
        throw new Error(400)
      }
    } else {
      if (contentType !== 'application/x-www-form-urlencoded') {
        throw new Error(400)
      }
    }
  }
  if (encType) {
    pageInstance.encType = true
    uploadControls = getUploadControls(pageInstance)
    setUploadControlsMaxSize(uploadControls)
  }

  return pageInstance
}

module.exports = setMultipartForm
