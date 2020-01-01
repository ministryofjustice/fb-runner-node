/**
 * @module loadJSON
 **/

const fs = require('fs')
const glob = require('glob-promise')
const loadJsonFile = require('load-json-file')

const {
  FBError
} = require('@ministryofjustice/fb-utils-node')

class JSONLoadError extends FBError {}

/**
 * Convenience promise rejector for wrong type
 *
 * @async
 *
 * @param {string} type
 * Incorrect type passed
 *
 * @return {Promise.<JSONLoadError>}
 * Promised JSONLoadError
 **/
const rejectWrongType = type => {
  return Promise.reject(new JSONLoadError(`${type} passed instead of an object`, {
    error: {
      code: 'EWRONGTYPE'
    }
  }))
}

/**
 * Load json files
 *
 * @async
 *
 * @param {{source: string, path: string}} sourceObj
 * Path to load json from and source key to return it against
 *
 * @return {Promise.<{source: string, instances: array}>}
 * Promised object containing loaded json
 **/
const getJsonSrc = sourceObj => {
  if (sourceObj === null) {
    return rejectWrongType('null')
  }
  if (Array.isArray(sourceObj)) {
    return rejectWrongType('array')
  }
  if (typeof sourceObj !== 'object') {
    return rejectWrongType(typeof sourceObj)
  }
  if (!sourceObj.source) {
    return Promise.reject(new JSONLoadError('No source specified', {
      error: {
        code: 'ENOSOURCE'
      }
    }))
  }
  if (!sourceObj.path) {
    return Promise.reject(new JSONLoadError('No path specified', {
      error: {
        code: 'ENOPATH'
      }
    }))
  }
  let jsonPaths = []
  const pathExists = fs.existsSync(sourceObj.path)
  if (!pathExists) {
    return Promise.reject(new JSONLoadError(`${sourceObj.path} does not exist`, {
      error: {
        code: 'EPATHDOESNOTEXIST'
      }
    }))
  }
  jsonPaths = glob.sync(`${sourceObj.path}/**/*.json`)
  const jsonPromises = jsonPaths.map(jsonPath => loadJsonFile(jsonPath))
  return Promise.all(jsonPromises)
    .then(instances => {
      return {
        source: sourceObj.source,
        instances
      }
    })
}

/**
 * Load json files from multiple locations
 *
 * @async
 *
 * @param {array.<{source: string, path: string}>} sourceObjs
 *  Array of objects specifying
 *  - path to load json from
 *  - source as key to store return loaded instances against
 *
 * @param {string} sourceObjs[].path
 * path to load json from
 *
 * @param {string} sourceObjs[].source
 * source as key to store return loaded instances against
 *
 * @return {Promise.<array.<{source: string, instances: array}>>}
 *  Promised array of loaded json
 **/
const load = sourceObjs => {
  const sources = sourceObjs.map(sourceObj => sourceObj ? sourceObj.source : sourceObj)
  const uniqueSources = sources.filter((elem, pos, arr) => arr.indexOf(elem) === pos)
  if (sources.length !== uniqueSources.length) {
    return Promise.reject(new JSONLoadError('Sources should be unique', {
      error: {
        code: 'EDUPLICATESOURCES'
      },
      data: {
        sources
      }
    }))
  }

  const srcPromises = sourceObjs.map(sourceObj => getJsonSrc(sourceObj))
  return Promise.all(srcPromises)
}
module.exports = {
  load
}
