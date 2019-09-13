const {getServiceSchema} = require('../../service-data/service-data')

const skipControlProcessing = (pageInstance, userData, nameInstance) => {
  const {_type} = nameInstance

  // don't process fileuploads
  if (_type === 'fileupload') {
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
