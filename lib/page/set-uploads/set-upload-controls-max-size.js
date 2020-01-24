require('@ministryofjustice/module-alias/register-module')(module)

const bytes = require('bytes')

const {
  getComponents
} = require('~/fb-runner-node/page/utils/utils-uploads')

const {
  getInstanceProperty
} = require('~/fb-runner-node/service-data/service-data')

module.exports = function setUploadControlsMaxSize (pageInstance) {
  const DEFAULTMAXSIZE = getInstanceProperty('upload.maxsize', 'value')
  const defaultMaxSize = bytes.parse(DEFAULTMAXSIZE) ? bytes.parse(DEFAULTMAXSIZE) : 7340032 // 7MB

  setUploadControlsMaxSize.defaultMaxSize = defaultMaxSize

  getComponents(pageInstance)
    .filter(({_type}) => _type === 'upload')
    .forEach((control) => {
      const {
        validation = {},
        validation: {
          maxSize: MAXSIZE = defaultMaxSize
        } = {}
      } = control

      const maxSize = bytes.parse(MAXSIZE)

      control.validation = {
        ...validation,
        ...maxSize
          ? {maxSize, maxSizeHuman: bytes.format(maxSize)}
          : {maxSize: defaultMaxSize, maxSizeHuman: bytes.format(defaultMaxSize)}
      }
    })
}
