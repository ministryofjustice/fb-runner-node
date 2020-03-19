require('@ministryofjustice/module-alias/register-module')(module)

const { getServiceSchema } = require('~/fb-runner-node/service-data/service-data')

const skipControlProcessing = (pageInstance, userData, nameInstance) => {
  const { _type } = nameInstance

  // don't process uploads
  if (_type === 'upload') {
    return true
  }

  const schema = getServiceSchema(_type)
  if (!schema || !schema.properties || !schema.properties.name) {
    return true
  }
  const nameSchema = schema.properties.name
  if (!nameSchema.processInput) {
    return true
  }
}

module.exports = skipControlProcessing
