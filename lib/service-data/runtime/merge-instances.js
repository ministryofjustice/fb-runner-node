/**
 * @module mergeInstances
 **/

const jsonPath = require('jsonpath')

const {FBLogger, FBError} = require('@ministryofjustice/fb-utils-node')

const clone = require('lodash.clone')

class FBMergeError extends FBError {}

/**
 * Add a $source property to instances indicating their source
 *
 * @param {{source: string, instances: array}} instanceSource
 * Object detailed below
 *
 * @param {string} source.source
 * Name of data source
 *
 * @param {array<instances>} source.instances
 * Instances to annotate
 *
 * @return {Promise.<{source: string, instances: array}>}
 * Promised object containing annotated instances
 **/
function annotateInstances ({source, instances, ...rest}) {
  return {
    ...rest,
    source,
    instances: instances.map((instance) => Object.assign({$source: source}, instance))
  }
}

/**
 * Merge data from multiple sources
 *
 * @param {array.<{source: string, instances: array}>} sources
 *  Array of objects specifying
 *  - name of source instance loaded from
 *  - loaded instances
 *
 * @return {object}
 * Merged instances
 **/
function flattenSources (sources) {
  const instances = {}
  const processed = {}

  const instancesBySource = {}

  sources
    .forEach(({source, instances}) => {
      instancesBySource[source] = instances.reduce((accumulator, instance) => {
        accumulator[instance._id] = clone(instance)
        return accumulator
      }, {})
    })

  const mappedSources = sources.map(({source}) => source).reverse()

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
      isaSource = mappedSources.find((source) => instancesBySource[source][isaId])
    }

    if (!isaSource) {
      throwFlattenError(`No instance "${isaId}" found, referenced by "${instance._id}"`, 'ENOISA')
    } else if (!instancesBySource[isaSource]) {
      throwFlattenError(`No source "${isaSource}" for instance "${isaId}", referenced by "${instance._id}"`, 'ENOISASOURCE')
    } else if (!instancesBySource[isaSource][isaId]) {
      throwFlattenError(`No instance "${isaId}" found in source "${isaSource}", referenced by "${instance._id}"`, 'ENOISAINSOURCE')
    }

    // const originalInstance = cloneDeep(instance)
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

  mappedSources.forEach((sourceName) => {
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
 * @param {array.<{source: string, instances: array}>} sources
 *  Array of objects specifying
 *  - name of source instance loaded from
 *  - loaded instances
 *
 * @return {object}
 * Merged instances
 **/
function merge (sources) {
  return flattenSources(
    sources.map((source) => annotateInstances(source))
  )
}

module.exports = {
  merge
}
