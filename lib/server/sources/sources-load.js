const {
  loadServiceData
} = require('../../service-data/service-data')

const loadMetadata = require('./sources-load-metadata')
const loadSchemas = require('./sources-load-schemas')

const loadSources = async (serviceSources) => {
  loadMetadata(serviceSources)

  const schemas = await loadSchemas(serviceSources)

  const serviceData = await loadServiceData()

  return {
    schemas,
    serviceData
  }
}

module.exports = loadSources
