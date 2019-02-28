const jp = require('jsonpath')
const bytes = require('bytes')

const defaultMaxFileSize = bytes('10Mb')

const setUploadControlsMaxSize = (uploadControls) => {
  jp.apply(uploadControls, '$[*]', val => {
    if (val.maxSize) {
      val.maxSize = bytes(val.maxSize)
      val.maxSizeHuman = bytes(val.maxSize)
    }
    val.maxSize = val.maxSize || defaultMaxFileSize
    return val
  })
}

module.exports = setUploadControlsMaxSize
