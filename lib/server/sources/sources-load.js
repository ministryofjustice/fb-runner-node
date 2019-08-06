const loadMetadata = require('./load/sources-load-metadata')
const loadSchemas = require('./load/sources-load-schemas')
const loadControllers = require('./load/sources-load-controllers')

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
