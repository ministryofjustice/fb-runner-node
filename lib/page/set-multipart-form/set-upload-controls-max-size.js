const jp = require('jsonpath')
const bytes = require('bytes')

const {getInstanceProperty} = require('../../service-data/service-data')

let defaultMaxSize

const setUploadControlsMaxSize = (uploadControls) => {
  if (!defaultMaxSize) {
    const fileuploadMaxsize = getInstanceProperty('fileupload.maxsize', 'value') || '7Mb'
    defaultMaxSize = bytes(fileuploadMaxsize)
    setUploadControlsMaxSize.defaultMaxSize = defaultMaxSize
  }
  jp.apply(uploadControls, '$[*]', val => {
    if (val.maxSize) {
      val.maxSize = bytes(val.maxSize)
    }
    val.maxSize = val.maxSize || defaultMaxSize
    val.maxSizeHuman = bytes(val.maxSize)
    return val
  })
}

module.exports = setUploadControlsMaxSize
