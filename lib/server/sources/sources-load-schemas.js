const path = require('path')

const schemaUtils = require('@ministryofjustice/fb-specification/lib/schema-utils')

const {
  setServiceSchemas
} = require('../../service-data/service-data')

const loadSchemas = async (serviceSources) => {
  // Get specification objects for component paths
  const specificationSources = []
  serviceSources.forEach(specificationSource => {
    const {sourcePath} = specificationSource
    let specs = {}
    try {
      const packageJSON = require(path.join(sourcePath, 'package.json'))
      specs = packageJSON.specifications
    } catch (e) {
      //
    }
    if (specs && specs.$idRoot) {
      specs.path = sourcePath
    } else {
      specs = undefined
    }
    if (specs) {
      specificationSources.push(specs)
    }
  })

  const schemas = await schemaUtils(specificationSources).load()
  setServiceSchemas(schemas)

  return schemas
}

module.exports = loadSchemas
