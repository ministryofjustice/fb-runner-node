const loadMetadata = require('./sources-load-metadata')
const loadSchemas = require('./sources-load-schemas')
const loadControllers = require('./sources-load-controllers')

const loadSources = async (serviceSources) => {
  const schemas = await loadSchemas(serviceSources)

  const serviceData = await loadMetadata(serviceSources)

  loadControllers(serviceSources)

  return {
    schemas,
    serviceData
  }
}

module.exports = loadSources
