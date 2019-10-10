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

    const {
      validation = {}
    } = val

    const {
      maxSize = defaultMaxSize
    } = validation

    validation.maxSize = bytes(maxSize)
    validation.maxSizeHuman = bytes(maxSize)

    val.validation = validation

    return val
  })
}

module.exports = setUploadControlsMaxSize
