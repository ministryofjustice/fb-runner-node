require('@ministryofjustice/module-alias/register-module')(module)

const {getUploadControls} = require('~/fb-runner-node/page/utils/utils-uploads')
const setMOJUploadControlsMaxSize = require('./set-moj-upload-controls-max-size')

module.exports = async function setMOJMultipartForm (pageInstance, userData) {
  const uploadControls = getUploadControls(pageInstance)

  /**
   * All upload controls
   */
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

    /**
     * Filter upload controls
     */
    const uploadControls = getUploadControls(pageInstance)
      .filter(({_type}) => _type === 'mojUpload')

    setMOJUploadControlsMaxSize(uploadControls)
  }

  return pageInstance
}
