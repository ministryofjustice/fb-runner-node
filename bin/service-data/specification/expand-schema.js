#!/usr/bin/env node

require('@ministryofjustice/module-alias/register')

const getComponentsPath = require('./get-components-path')
const getSchemas = require('./get-schemas')
const schemaUtils = require('~/fb-runner-node/service-data/specification')

const componentsPath = getComponentsPath()
const schemaObjs = getSchemas(componentsPath)

const {expandSchema} = schemaUtils(schemaObjs)

const debug = require('debug')
const log = debug('runner:expand-schema')
const error = debug('runner:expand-schema')

debug.enable('runner:*')

const schemaName = process.argv[2]
if (schemaName) {
  expandSchema(schemaName)
    .then((schema) => {
      log(JSON.stringify(schema, null, 2))
      log('properties', JSON.stringify(Object.keys(schema.properties), null, 2))
      log('--------')
      process.exit(0)
    })
    .catch((e) => {
      error('Unexpected error', e)
      process.exit(1)
    })
} else {
  error('Please supply a schema name')
  process.exit(1)
}
