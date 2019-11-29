require('@ministryofjustice/module-alias/register-module')(module)

const jsonPath = require('jsonpath')
const bytes = require('bytes')

const {getInstanceProperty} = require('~/fb-runner-node/service-data/service-data')

module.exports = function setMOJUploadControlsMaxSize (uploadControls) {
  const defaultMaxSize = getInstanceProperty('mojFileupload.maxsize', 'value') || '7Mb'

  setMOJUploadControlsMaxSize.defaultMaxSize = bytes(defaultMaxSize)

  jsonPath.apply(uploadControls, '$[*]', val => {
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
