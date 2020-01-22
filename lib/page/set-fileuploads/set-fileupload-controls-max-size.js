require('@ministryofjustice/module-alias/register-module')(module)

const jsonPath = require('jsonpath')
const bytes = require('bytes')

const {getComponents} = require('~/fb-runner-node/page/utils/utils-uploads')
const {getInstanceProperty} = require('~/fb-runner-node/service-data/service-data')

module.exports = function setFileUploadControlsMaxSize (pageInstance) {
  const defaultMaxSize = getInstanceProperty('fileupload.maxsize', 'value') || '7Mb'

  setFileUploadControlsMaxSize.defaultMaxSize = bytes(defaultMaxSize)

  /**
   * Filter upload controls
   */
  const uploadControls = getComponents(pageInstance)
    .filter(({_type}) => _type === 'fileupload')

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
