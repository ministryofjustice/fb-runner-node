require('@ministryofjustice/module-alias/register')

const path = require('path')
const {
  existsSync
} = require('fs')

const {
  setServiceSources,
  loadServiceData
} = require('~/fb-runner-node/service-data/service-data')

const loadMetadata = async (serviceSources) => {
  // Get data sources for component paths
  const metadataSources = []
  serviceSources.forEach(metadataSource => {
    let {source, sourcePath} = metadataSource
    sourcePath = path.join(sourcePath, 'metadata')
    if (existsSync(sourcePath)) {
      metadataSources.push({
        source,
        path: sourcePath
      })
    }
  })

  setServiceSources(metadataSources)

  const serviceData = await loadServiceData()

  return serviceData
}

module.exports = loadMetadata
