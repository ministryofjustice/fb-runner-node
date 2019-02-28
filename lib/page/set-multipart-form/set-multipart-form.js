const {default: produce} = require('immer')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {getUploadControls} = require('../utils/utils')
const setUploadControlsMaxSize = require('./set-upload-controls-max-size')

const setMultipartForm = async (pageInstance, userData) => {
  let uploadControls = getUploadControls(pageInstance)
  if (uploadControls.length) {
    pageInstance = deepClone(pageInstance)
    pageInstance.encType = true
    uploadControls = getUploadControls(pageInstance)
    setUploadControlsMaxSize(uploadControls)
  }

  // make pageInstance immutable again
  pageInstance = produce(pageInstance, draft => draft)
  return pageInstance
}

module.exports = setMultipartForm
