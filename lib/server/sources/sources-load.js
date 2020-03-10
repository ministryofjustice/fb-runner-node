const loadMetadata = require('./load/sources-load-metadata')
const loadSchemas = require('./load/sources-load-schemas')

module.exports = async function loadSources (serviceSources) {
  const schemas = await loadSchemas(serviceSources)
  const serviceData = await loadMetadata(serviceSources)

  return {
    schemas,
    serviceData
  }
}
