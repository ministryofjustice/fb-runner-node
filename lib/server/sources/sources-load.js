const loadMetadata = require('./sources-load-metadata')
const loadSchemas = require('./sources-load-schemas')

const loadSources = async (serviceSources) => {
  const schemas = await loadSchemas(serviceSources)

  const serviceData = await loadMetadata(serviceSources)

  return {
    schemas,
    serviceData
  }
}

module.exports = loadSources
