require('module-alias/register')

const path = require('path')
const loadJson = require('load-json-file').sync

const schemaUtils = require('@ministryofjustice/fb-specification/lib/schema-utils')

const {
  setServiceSchemas
} = require('~/service-data/service-data')

const loadSchemas = async (serviceSources) => {
  // Get specification objects for component paths
  const specificationSources = []
  serviceSources.forEach(specificationSource => {
    const {sourcePath} = specificationSource
    let specs = {}
    const packagePath = path.join(sourcePath, 'package.json')
    try {
      const packageJSON = loadJson(packagePath)
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
