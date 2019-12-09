require('@ministryofjustice/module-alias/register-module')(module)

const bytes = require('bytes')

const {
  getUploadControls
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  getInstanceProperty
} = require('~/fb-runner-node/service-data/service-data')

module.exports = function setUploadControlsMaxSize (pageInstance) {
  const maxSize = getInstanceProperty('upload.maxsize', 'value')
  const defaultMaxSize = isNaN(bytes.parse(maxSize)) ? bytes.parse('7MB') : bytes.parse(maxSize)

  setUploadControlsMaxSize.defaultMaxSize = defaultMaxSize

  getUploadControls(pageInstance)
    .filter(({_type}) => _type === 'upload')
    .forEach((control) => {
      const {
        validation = {},
        validation: {
          maxSize = defaultMaxSize
        } = {}
      } = control

      control.validation = {
        ...validation,
        maxSize: isNaN(bytes.parse(maxSize)) ? defaultMaxSize : bytes.parse(maxSize),
        maxSizeHuman: isNaN(bytes.parse(maxSize)) ? bytes.format(defaultMaxSize) : bytes.format(bytes.parse(maxSize))
      }
    })
}
