#!/usr/bin/env node

require('@ministryofjustice/module-alias/register')

const glob = require('glob-promise')
const getComponentsPath = require('./get-components-path')
const getSchemas = require('./get-schemas')

const validateSchema = require('~/fb-runner-node/service-data/specification/validate-schema')

const debug = require('debug')
const log = debug('runner:validate')
const error = debug('runner:validate')

const CommonError = require('~/fb-runner-node/error')

class ValidateError extends CommonError {}

const componentsPath = getComponentsPath()

/**
 * Required:
 *   --path     Absolute path to all of the schemas
 *   --schema   Absolute path to one schema
 *   --id-root  e.g. "http://gov.uk/v1.0.0/schema"
 */

const argv = require('yargs')
  .version(false)
  .help()
  .alias('help', 'h')
  .option('quiet', {
    alias: 'q',
    description: 'Only show names of failing data files',
    default: false
  })
  .option('schema', {
    alias: 's',
    description: 'Validate named schema with test data',
    type: 'string'
  })
  .option('invalid', {
    alias: 'i',
    description: 'Input is expected to be invalid',
    type: 'boolean',
    default: false
  })
  .option('path', {
    alias: 'p',
    description: 'Path to specifications directory containing the schemas',
    type: 'array'
  })
  .option('idRoot', {
    alias: 'id',
    description: '$idRoot prefix to resolve $refs in schemas\n\nIf no idRoot and path are passed, package.json in the current directory is checked for a $idRoot property and if found that value is used for idRoot and the current directory for path',
    type: 'array'
  })
  .option('allErrors', {
    alias: 'a',
    description: 'Show all errors instead of failing fast on first - use --no-a to fail fast',
    type: 'boolean',
    default: true
  })
  .option('debug', {
    alias: 'd',
    description: 'Show debug info',
    type: 'boolean',
    default: false
  })
  .check((argv, options) => {
    const { path, schema } = argv
    if (!path && !schema && !argv._.length) {
      return false
    }
    return true
  }).argv

const {
  schema,
  invalid,
  directory,
  quiet,
  allErrors,
  debug: debugInfo,
  path: schemaPaths,
  idRoot: idRoots
} = argv

let specs = []
try {
  if (schemaPaths && !idRoots) {
    throw new ValidateError('No value passed for --idRoot when --path passed')
  }

  if (!schemaPaths && idRoots) {
    throw new ValidateError('No value passed for --path when --idRoot passed')
  }

  if (!schemaPaths && !idRoots) {
    const schemaObjs = getSchemas(componentsPath)
    if (schemaObjs.length) {
      specs = schemaObjs
    }
  } else if (schemaPaths) {
    if (schemaPaths.length !== idRoots.length) {
      throw new ValidateError('Different number of values for --path and --idRoot passed', {
        data: argv
      })
    }
    specs = []
    schemaPaths.forEach((item, index) => {
      specs.push({
        path: item,
        $idRoot: idRoots[index]
      })
    })
  }
} catch ({ message, data }) {
  error(message, data)
  process.exit(1)
}

const options = {
  specs,
  allErrors,
  debug: debugInfo
}

let files

if (argv._.length) {
  const firstArg = argv._[0]
  if (firstArg.includes('*')) {
    error(`No json files found matching ${argv._[0]}`)
    process.exit(1)
  }
  files = argv._
  if (argv._.length === 1 && !firstArg.endsWith('.json')) {
    files = glob.sync(`${firstArg}/*.json`)
    if (!files.length) {
      error(`No json files found in ${directory}`)
      process.exit(1)
    }
  }
}

if (files) {
  if (invalid) {
    options.invalid = files
  } else {
    options.valid = files
  }
}

validateSchema(schema, options)
  .then(results => {
    if (!results) {
      log('OK')
    } else {
      if (quiet) {
        Object.keys(results).forEach(type => {
          error(`Expected to be ${type} but not`)
          results[type].forEach(result => {
            error(`- ${result.path}`)
          })
        })
      } else {
        Object.keys(results).forEach(type => {
          error(`Expecting ${type} input`)
          error(results[type])
        })
      }
      process.exit(1)
    }
  })
  .catch(e => {
    error('Processing the data threw an unexpected error', e)
    process.exit(1)
  })
