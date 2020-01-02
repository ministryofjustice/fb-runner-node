const path = require('path')
const $refParser = require('json-schema-ref-parser')
const mergeAllOf = require('json-schema-merge-allof')

const glob = require('glob-promise')

const {FBError} = require('@ministryofjustice/fb-utils-node')

class FBSchemaError extends FBError { }

function protectRefs (schema, pattern) {
  const schemaJson = JSON.stringify(schema)
  return JSON.parse(schemaJson.replace(pattern, '"PROTECTEDREF": $1'))
}

function restoreRefs (schema) {
  const schemaJson = JSON.stringify(schema)
  return JSON.parse(schemaJson.replace(/PROTECTEDREF/g, '$ref'))
}

function schemaUtils (specs = [{}]) {
  const idRootToPathMap = new Map()
  const namePrefixMap = new Map()
  const idRootToNameMap = new Map()

  const rawSchemaMap = {}
  const protectedSchemaMap = {}

  specs.forEach(({$idRoot, path}) => {
    const name = $idRoot
      .replace(/.*\/v\d+\.\d+\.\d+\/*/, '')
      .replace(/\//g, '.')

    idRootToPathMap.set($idRoot, path)
    namePrefixMap.set(name, $idRoot)
    idRootToNameMap.set($idRoot, name) // default is zero-length string
  })

  const specsPathMatchOrder = specs.map(({$idRoot}) => $idRoot)
    .sort()
    .reverse()

  const specsNameMatchOrder = Array.from(namePrefixMap.keys()) // keys is a pseudo array
    .sort()
    .reverse()

  const canReadPattern = new RegExp(`^(${specs.map(({$idRoot}) => $idRoot).sort().reverse().join('|')}).+`.replace(/\//g, '\\/'))

  /*
   *  AR's mechanism for enabling dereferencing:
   *
   *    - characterise circular references as "protected"
   *    - rename those fields from "$ref" to "PROTECTEDREF"
   *    - dereference
   *    - rename those fields from "PROTECTEDREF" to "$ref"
   */
  const protectedRefs = specs.reduce((accumulator, spec) => Array.isArray(spec.protected)
    ? accumulator.concat(spec.protected.map((value) => `${spec.$idRoot}/${value}`))
    : accumulator, [])

  let protectedRefPattern
  if (protectedRefs.length) {
    protectedRefPattern = new RegExp(`"\\$ref":\\s*("${protectedRefs.join('|')}")`, 'g')
  }

  function getPatternFromName (name) {
    return new RegExp(`^${mapIdRootToNamePrefix(mapNameToIdRoot(name))}\\.`)
  }

  function getBaseDirFromName (name) {
    return mapIdToDir(mapNameToIdRoot(name))
  }

  function mapIdToIdRoot ($id) {
    const $idRoot = specsPathMatchOrder.find((value) => $id.startsWith(value))

    if ($idRoot) return $idRoot

    throw new FBSchemaError('Schema URL cannot be resolved', {data: {schemaUrl: $id}})
  }

  function mapIdToDir ($id) {
    const $idRoot = mapIdToIdRoot($id)

    return idRootToPathMap.get($idRoot)
  }

  const mapIdRootToNamePrefix = ($idRoot) => idRootToNameMap.get($idRoot)

  function mapNameToIdRoot (name) {
    for (let i = 0, j = specsNameMatchOrder.length; i < j; i++) {
      const nameRoot = specsNameMatchOrder[i]

      if (!nameRoot) { // zero-length string
        return namePrefixMap.get(nameRoot)
      }

      if (name.startsWith(`${nameRoot}.`)) {
        return namePrefixMap.get(nameRoot)
      }
    }
  }

  function mapIdToName ($id) {
    const $idRoot = mapIdToIdRoot($id)
    const namePrefix = mapIdRootToNamePrefix($idRoot)

    let name = $id.replace($idRoot.concat('/'), '')
    if (namePrefix) {
      name = `${namePrefix}.${name}`
    }

    return name.replace(/\//g, '.')
  }

  function mapNameToPath (name) {
    let namePath = name
      .replace(getPatternFromName(name), '')
      .replace(/\./g, '/')

    if (namePath) {
      namePath += '/'
    }

    return `${getBaseDirFromName(name)}/specifications/${namePath}${name}.schema.json`
  }

  function mapIdToPath ($id) {
    const name = mapIdToName($id)

    return mapNameToPath(name)
  }

  async function load () {
    const schemas = {}
    await Promise.all(specs.map(({path}) => loadSchemaFromPath(schemas, path)))
    return schemas
  }

  function loadSchemaFromPath (schemas, path) {
    const schemaPaths = glob.sync(`${path}/specifications/**/*.schema.json`)

    async function expandSchemaFromPath (schemaPath) {
      const schema = require(schemaPath)
      const name = getSchemaName(schema)
      schemas[name] = await expandSchema(name, {path})
    }

    return Promise.all(schemaPaths.map(expandSchemaFromPath))
  }

  async function recurseRefs ($id) {
    if (protectedSchemaMap[$id]) {
      return protectedSchemaMap[$id]
    }

    const schemaPath = mapIdToPath($id)

    let schema = getRawSchemaByPath(schemaPath)

    /*
     *  Protect refs
     */
    schema = protectedRefPattern
      ? protectRefs(schema, protectedRefPattern)
      : schema

    return dereference(schema)
  }

  function merge (schema) {
    return mergeAllOf(schema, {
      resolvers: {
        type: ([value]) => value,
        const: ([value]) => value,
        category: (values) => Array.from(new Set(values.reduce((acc, val) => acc.concat(val), []))).sort(),
        _name: ([value]) => value
      }
    })
  }

  async function dereference (schema) {
    return $refParser.dereference(schema, {
      resolve: {
        $idRootMatch: {
          order: 1,
          canRead: canReadPattern,
          read: ({url}) => recurseRefs(url)
        }
      },
      dereference: {
        circular: 'ignore'
      }
    })
  }

  function getRawSchemaByName (key) {
    return rawSchemaMap[key] || (rawSchemaMap[key] = require(path.resolve(getSchemaPath(key.replace(/\//g, '.')))))
  }

  function getRawSchemaByPath (key) {
    return rawSchemaMap[key] || (rawSchemaMap[key] = require(key))
  }

  const getSchemaName = ({_name}) => _name

  const getSchemaDir = (name) => getSchemaPath(name).replace(/\/[^/]+$/, '')

  function getSchemaPath (key) {
    return key.endsWith('.schema.json')
      ? key
      : mapNameToPath(key)
  }

  function getRawSchema (key) {
    return key.endsWith('.json')
      ? getRawSchemaByPath(key)
      : getRawSchemaByName(key)
  }

  async function expandSchema (schemaName) {
    let schema
    try {
      schema = getRawSchemaByName(schemaName)
    } catch (e) {
      throw new FBSchemaError(`Could not load "${schemaName}"`, {error: e})
    }

    /*
     *  Protect refs
     */
    schema = protectedRefPattern
      ? protectRefs(schema, protectedRefPattern)
      : schema

    schema = await dereference(schema)

    schema = merge(schema)

    /*
     *  Cached schemas sit in memory for the lifetime of the app
     *
     *  Calls into `expandSchema` are iterative (so subsequent calls save
     *  a few milliseconds on retrieving a schema from the file system if
     *  that schema is already in the cache) but such calls are made at
     *  start-up so it's not a performance critical operation
     *
     *  We could clear the caches:
     *
     *    Object.keys(rawSchemaMap)
     *      .forEach((key) => delete rawSchemaMap[key])
     *
     *    Object.keys(protectedSchemaMap)
     *      .forEach((key) => delete protectedSchemaMap[key])
     *
     *  As well as remove the code below which adds a schema into the
     *  caches, of course
     */

    /*
     *  Store the schema ...
     */
    const {
      $id
    } = schema

    /*
     *  ... with protected refs
     */
    protectedSchemaMap[$id] = schema

    /*
     *  Restore refs
     */
    return protectedRefPattern
      ? restoreRefs(schema)
      : schema
  }

  return {
    load,
    getSchemaName,
    getSchemaDir,
    getSchemaPath,
    getRawSchema,
    expandSchema
  }
}

module.exports = schemaUtils
