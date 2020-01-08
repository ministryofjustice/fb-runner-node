#!/usr/bin/env node

require('@ministryofjustice/module-alias/register')

const getComponentsPath = require('./get-components-path')
const getSchemas = require('./get-schemas')
const schemaUtils = require('~/fb-runner-node/service-data/specification')

const componentsPath = getComponentsPath()
const schemaObjs = getSchemas(componentsPath)

const {expandSchema} = schemaUtils(schemaObjs)

const {FBLogger} = require('@ministryofjustice/fb-utils-node')

FBLogger.verbose(true)

const schemaName = process.argv[2]
if (schemaName) {
  expandSchema(schemaName)
    .then((schema) => {
      FBLogger(JSON.stringify(schema, null, 2))
      FBLogger('properties', JSON.stringify(Object.keys(schema.properties), null, 2))
      FBLogger('--------')
      process.exit(0)
    })
    .catch((e) => {
      FBLogger('Unexpected error', e)
      process.exit(1)
    })
} else {
  FBLogger('Please supply a schema name')
  process.exit(1)
}