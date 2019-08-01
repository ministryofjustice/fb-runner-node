const path = require('path')
const {
  existsSync
} = require('fs')

const {
  setServiceSources
} = require('../../service-data/service-data')

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
}

module.exports = loadMetadata
