/**
 * @module mergeInstances
 **/

const jsonPath = require('jsonpath')

const {FBLogger, FBError, clone, deepClone} = require('@ministryofjustice/fb-utils-node')

class FBMergeError extends FBError {}

/**
 * Add a $source property to instances indicating their source
 *
 * @param {{source: string, instances: array}} sourceObj
 * Object detailed below
 *
 * @param {string} sourceObj.source
 * Name of data source
 *
 * @param {array<instances>} sourceObj.instances
 * Instances to annotate
 *
 * @return {Promise.<{source: string, instances: array}>}
 * Promised object containing annotated instances
 **/
function annotateInstances (sourceObj) {
  const annotateSourceObj = clone(sourceObj)
  const {
    source,
    instances
  } = annotateSourceObj

  annotateSourceObj.instances = instances.map((instance) => Object.assign({$source: source}, instance))
  return annotateSourceObj
}

/**
 * Merge data from multiple sources
 *
 * @param {array.<{source: string, instances: array}>} sourceObjs
 *  Array of objects specifying
 *  - name of source instance loaded from
 *  - loaded instances
 *
 * @return {object}
 * Merged instances
 **/
function flattenSources (sourceObjs) {
  const instances = {}
  const processed = {}

  const instancesBySource = {}

  sourceObjs
    .forEach(({source, instances}) => {
      instancesBySource[source] = instances.reduce((accumulator, instance) => {
        accumulator[instance._id] = clone(instance)
        return accumulator
      }, {})
    })

  const sources = sourceObjs.map(({source}) => source).reverse()

  // TODO: make this a pure function rather than rely on the closure
  function expandIsa (instance) {
    function throwFlattenError (message, code) {
      throw new FBMergeError(message, {
        error: {
          code
        },
        data: {
          instance,
          instances
        }
      })
    }

    /**
     *  FB-721
     *  Prevents breaking Forms by mapping the `_isa` field from `fb-components-core` to `fb-components`
     */
    instance._isa = instance._isa.replace(/@ministryofjustice\/fb-components-core/ig, '@ministryofjustice/fb-components')

    let isaSource
    let isaId
    if (/(.*)=>(.*)/.test(instance._isa)) {
      [
        isaSource,
        isaId
      ] = instance._isa.split('=>')
    } else {
      isaId = instance._isa
    }

    if (!isaSource) {
      isaSource = sources.find((source) => instancesBySource[source][isaId])
    }

    if (!isaSource) {
      throwFlattenError(`No instance "${isaId}" found, referenced by "${instance._id}"`, 'ENOISA')
    } else if (!instancesBySource[isaSource]) {
      throwFlattenError(`No source "${isaSource}" for instance "${isaId}", referenced by "${instance._id}"`, 'ENOISASOURCE')
    } else if (!instancesBySource[isaSource][isaId]) {
      throwFlattenError(`No instance "${isaId}" found in source "${isaSource}", referenced by "${instance._id}"`, 'ENOISAINSOURCE')
    }

    // const originalInstance = deepClone(instance)
    const isaInstance = expandInstanceRef(instancesBySource[isaSource][isaId])

    // instance.$original = originalInstance
    return Object.assign({}, isaInstance, instance)
  }

  // TODO: make this a pure function rather than rely on the closure
  function expandInstanceRef (instance) {
    const processedKey = `${instance.$source}=>${instance._id}`

    if (processed[processedKey]) {
      return instance
    }

    // jsonpath can't set a value on the object itself
    const instanceWrapper = {
      instance
    }

    // TODO: use '$..[*][?(@._isa)]' instead?
    const isaPaths = jsonPath.paths(instanceWrapper, '$.._isa')
    isaPaths.forEach((isaPath) => {
      isaPath.pop()

      const propertyPath = jsonPath.stringify(isaPath)

      const isaRefPropertyInstance = expandIsa(jsonPath.query(instanceWrapper, propertyPath)[0])
      if (propertyPath !== '$.instance') {
        jsonPath.value(instanceWrapper, propertyPath, isaRefPropertyInstance)
      } else {
        Object.assign(instance, isaRefPropertyInstance)
      }
    })

    processed[processedKey] = true
    return instance
  }

  sources.forEach((sourceName) => {
    Object.keys(instancesBySource[sourceName])
      .forEach(instanceId => {
        const instance = instancesBySource[sourceName][instanceId]
        if (!instances[instance._id]) {
          instances[instance._id] = expandInstanceRef(instance)
        } else {
          FBLogger(`already got ${instance._id}`)
        }
      })
  })

  return instances
}

/**
 * Merge and annotate data from multiple sources
 *
 * @param {array.<{source: string, instances: array}>} sourceObjs
 *  Array of objects specifying
 *  - name of source instance loaded from
 *  - loaded instances
 *
 * @return {object}
 * Merged instances
 **/
function merge (sourceObjs) {
  sourceObjs = deepClone(sourceObjs)
  const annotatedSources = sourceObjs.map(sourceObj => annotateInstances(sourceObj))
  return flattenSources(annotatedSources)
}

module.exports = {
  merge
}
