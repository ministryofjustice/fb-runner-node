/**
 * @module loadJSON
 **/
require('@ministryofjustice/module-alias/register-module')(module)

const fs = require('fs')
const glob = require('glob-promise')
const loadJsonFile = require('load-json-file')

const CommonError = require('~/fb-runner-node/error')

class LoadJSONError extends CommonError {}

/**
 * Load json files
 *
 * @async
 *
 * @param {{source: string, path: string}} jsonSource
 * Path to load json from and source key to return it against
 *
 * @return {Promise.<{source: string, instances: array}>}
 * Promised object containing loaded json
 **/
function getJsonSrc (jsonSource) {
  if (jsonSource === null) {
    return Promise.reject(new LoadJSONError('"null" is not an object', {
      error: {
        code: 'EWRONGTYPE'
      }
    }))
  }

  if (Array.isArray(jsonSource)) {
    return Promise.reject(new LoadJSONError('"array" is not an object', {
      error: {
        code: 'EWRONGTYPE'
      }
    }))
  }

  if (typeof jsonSource !== 'object') {
    return Promise.reject(new LoadJSONError(`"${typeof jsonSource}" is not an object`, {
      error: {
        code: 'EWRONGTYPE'
      }
    }))
  }

  if (!jsonSource.source) {
    return Promise.reject(new LoadJSONError('No source specified', {
      error: {
        code: 'ENOSOURCE'
      }
    }))
  }

  if (!jsonSource.path) {
    return Promise.reject(new LoadJSONError('No path specified', {
      error: {
        code: 'ENOPATH'
      }
    }))
  }

  const pathExists = fs.existsSync(jsonSource.path)
  if (!pathExists) {
    return Promise.reject(new LoadJSONError(`Path "${jsonSource.path}" not found`, {
      error: {
        code: 'EPATHDOESNOTEXIST'
      }
    }))
  }

  const jsonFiles = glob.sync(`${jsonSource.path}/**/*.json`).map((jsonPath) => loadJsonFile(jsonPath))

  return Promise.all(jsonFiles)
    .then((instances) => ({
      source: jsonSource.source,
      instances
    }))
}

/**
 * Load json files from multiple locations
 *
 * @async
 *
 * @param {array.<{source: string, path: string}>} jsonSources
 *  Array of objects specifying
 *  - path to load json from
 *  - source as key to store return loaded instances against
 *
 * @param {string} jsonSources[].path
 * path to load json from
 *
 * @param {string} jsonSources[].source
 * source as key to store return loaded instances against
 *
 * @return {Promise.<array.<{source: string, instances: array}>>}
 *  Promised array of loaded json
 **/
function load (jsonSources) {
  /*
   *  Soz
   */
  const sourceSources = jsonSources.map((jsonSource) => jsonSource ? jsonSource.source : jsonSource)
  const uniqueSources = sourceSources.reduce((accumulator, source) => accumulator.includes(source) ? accumulator : accumulator.concat(source), [])
  if (sourceSources.length !== uniqueSources.length) {
    return Promise.reject(new LoadJSONError('Sources must be unique', {
      error: {
        code: 'EDUPLICATESOURCES'
      },
      data: {
        sources: sourceSources
      }
    }))
  }

  return Promise.all(jsonSources.map((jsonSource) => getJsonSrc(jsonSource)))
}
module.exports = {
  load
}
