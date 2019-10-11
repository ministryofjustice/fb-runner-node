const jp = require('jsonpath')
const bytes = require('bytes')

const {getInstanceProperty} = require('../../service-data/service-data')

let defaultMaxSize

const setUploadControlsMaxSize = (uploadControls) => {
  if (!defaultMaxSize) {
    const fileuploadMaxsize = getInstanceProperty('fileupload.maxsize', 'value') || '7Mb'
    defaultMaxSize = fileuploadMaxsize
    setUploadControlsMaxSize.defaultMaxSize = bytes(defaultMaxSize)
  }

  jp.apply(uploadControls, '$[*]', val => {
    const {
      validation = {}
    } = val

    const {
      maxSize = defaultMaxSize
    } = validation

    validation.maxSize = bytes(maxSize) || bytes(defaultMaxSize)
    validation.maxSizeHuman = bytes(validation.maxSize) || bytes(defaultMaxSize)

    val.validation = validation

    return val
  })
}

module.exports = setUploadControlsMaxSize
