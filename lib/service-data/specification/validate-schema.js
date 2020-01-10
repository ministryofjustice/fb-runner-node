#!/usr/bin/env node
const glob = require('glob-promise')
const path = require('path')
const jsonpath = require('jsonpath')
const Ajv = require('ajv')

const debug = require('debug')
const log = debug('runner:validate-schema')
const error = debug('runner:validate-schema')

debug.enable('runner:*')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const schemaUtils = require('./schema-utils')

async function validateSchema (schema, options = {}) {
  const {
    getRawSchema,
    getSchemaDir,
    getSchemaPath
  } = schemaUtils(options.specs)

  if (options.allErrors === undefined) {
    options.allErrors = true
  }

  const loadedSchemas = deepClone(options.schemas) || {}
  const ajv = new Ajv(options)

  function fetchRefs (schema) {
    const dollarSchema = JSON.parse(JSON.stringify(schema).replace(/"\$ref"/g, '"DOLLARref"'))
    const refs = jsonpath.query(dollarSchema, '$..DOLLARref')
      .filter(ref => !ref.startsWith('#'))
      .map(ref => ref.replace(/#.*/, ''))
      .filter((item, pos, arr) => arr.indexOf(item) === pos)
      .map(ref => ref.replace(/.*schema\/v\d+\.\d+\.\d+\//, ''))

    refs.forEach(ref => {
      if (!loadedSchemas[ref]) {
        loadedSchemas[ref] = getRawSchema(ref)
        try {
          ajv.addSchema(loadedSchemas[ref])
        } catch (e) {
          error('AJV error - continuing')
        }
        fetchRefs(loadedSchemas[ref])
      }
    })
  }

  let globalSchema
  if (schema) {
    globalSchema = require(path.resolve(getSchemaPath(schema)))

    if (!options.valid && !options.invalid) {
      options.path = options.path || getSchemaDir(schema)
    }
    if (!options.valid && options.invalid) {
      options.valid = []
    }
    if (!options.invalid && options.valid) {
      options.invalid = []
    }
  }

  const validGlob = options.valid || glob(`${options.path}/data/valid/**.json`)
  const invalidGlob = options.invalid || glob(`${options.path}/data/invalid/**.json`)

  async function validateData (dataPath, schema) {
    const data = require(path.resolve(dataPath))
    let dataSchema
    if (schema) {
      dataSchema = schema
    } else {
      if (!data._type) {
        return Promise.resolve({
          path: dataPath,
          data,
          errors: [
            {
              message: 'should have required property \'_type\''
            }
          ]
        })
      }
      dataSchema = getRawSchema(data._type)
    }

    fetchRefs(dataSchema)

    const validate = ajv.compile(dataSchema)
    const result = {
      path: dataPath,
      schema: dataSchema._name,
      data
    }
    const valid = validate(data)
    if (!valid) {
      result.errors = validate.errors
    }

    return result
  }

  async function validateDataPaths (dataPaths, invalid) {
    return Promise.all(dataPaths.map((dataPath) => validateData(dataPath, globalSchema)))
      .then((results) => {
        let failed
        let errors = []
        if (!invalid) {
          errors = results
            .filter(result => result.errors)
            .map(result => {
              result.expected = 'valid'
              return result
            })
        } else {
          errors = results
            .filter(result => !result.errors)
            .map(result => {
              result.expected = 'invalid'
              result.errors = [
                {
                  message: 'should be invalid'
                }
              ]
              return result
            })
        }
        if (errors.length) {
          failed = errors
        }
        return failed
      })
  }

  return Promise.all([validGlob, invalidGlob])
    .then(files => {
      const validFiles = files[0]
      const invalidFiles = files[1]
      if (options.debug && !options.warn) {
        log({files})
      }

      if (options.warn) {
        if (!validFiles.length) {
          log(`Valid JSON not found for Schema "${schema}"`)
        }

        if (!invalidFiles.length) {
          log(`Valid JSON not found for Schema "${schema}"`)
        }
      }

      return Promise.all([
        validateDataPaths(validFiles),
        validateDataPaths(invalidFiles, true)
      ])
    })
    .then(results => {
      if (results.filter(result => result).length) {
        const returnBundle = {
          valid: results[0],
          invalid: results[1]
        }

        if (!returnBundle.valid) {
          delete returnBundle.valid
        }

        if (!returnBundle.invalid) {
          delete returnBundle.invalid
        }

        return returnBundle
      }
    })
}

module.exports = validateSchema
