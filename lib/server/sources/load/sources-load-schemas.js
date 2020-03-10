require('@ministryofjustice/module-alias/register-module')(module)

const debug = require('debug')
const error = debug('runner:sources-load')

const path = require('path')
const {
  sync: loadJson
} = require('load-json-file')

const schemaUtils = require('~/fb-runner-node/service-data/specification/schema-utils')

const {
  setServiceSchemas
} = require('~/fb-runner-node/service-data/service-data')

module.exports = async function loadSchemas (serviceSources) {
  const specificationSources = serviceSources.reduce((accumulator, { sourcePath }) => {
    let specifications = {}
    const packagePath = path.join(sourcePath, 'package.json')

    try {
      ({
        specifications = {}
      } = loadJson(packagePath))
    } catch (e) {
      error(`No package at source path "${sourcePath}"`)
    }

    if (specifications.$idRoot) {
      specifications.path = sourcePath

      return accumulator.concat(specifications)
    }

    return accumulator
  }, [])

  const schemas = await schemaUtils(specificationSources).load()

  setServiceSchemas(schemas)

  return schemas
}
