/**
 * @module mergeInstances
 **/

const jsonPath = require('jsonpath')

const {FBLogger, FBError} = require('@ministryofjustice/fb-utils-node')

class FBMergeError extends FBError {}

/**
 * Add a $source property to instances indicating their source
 *
 * @param {{source: string, instances: array}} source
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
function annotateSource ({source, instances, ...sources}) {
  return {
    ...sources,
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
  const sourceNameMap = {}

  sources
    .forEach(({source: sourceName, instances}) => {
      sourceNameMap[sourceName] = instances.reduce((accumulator, instance) => {
        const {_id} = instance

        return {
          ...accumulator,
          [_id]: instance
        }
      }, {})
    })

  const sourceNames = sources.map(({source: sourceName}) => sourceName).reverse()

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
      isaSource = sourceNames.find((sourceName) => sourceNameMap[sourceName][isaId])
    }

    if (!isaSource) {
      throwFlattenError(`No instance "${isaId}" found, referenced by "${instance._id}"`, 'ENOISA')
    } else if (!sourceNameMap[isaSource]) {
      throwFlattenError(`No source "${isaSource}" for instance "${isaId}", referenced by "${instance._id}"`, 'ENOISASOURCE')
    } else if (!sourceNameMap[isaSource][isaId]) {
      throwFlattenError(`No instance "${isaId}" found in source "${isaSource}", referenced by "${instance._id}"`, 'ENOISAINSOURCE')
    }

    // const originalInstance = cloneDeep(instance)
    const isaInstance = expandInstanceRef(sourceNameMap[isaSource][isaId])

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
    jsonPath.paths(instanceWrapper, '$.._isa')
      .forEach((isaPath) => {
        /*
         *  Remove the last item, which is '_isa'
         */
        isaPath.pop()

        const propertyPath = jsonPath.stringify(isaPath)

        const [
          isa
        ] = jsonPath.query(instanceWrapper, propertyPath)

        const propertyInstance = expandIsa(isa)

        if (propertyPath !== '$.instance') {
          jsonPath.value(instanceWrapper, propertyPath, propertyInstance)
        } else {
          Object.assign(instance, propertyInstance)
        }
      })

    processed[processedKey] = true
    return instance
  }

  FBLogger('Expanding instances ...')

  sourceNames
    .forEach((sourceName) => {
      Object
        .values(sourceNameMap[sourceName])
        .forEach((instance) => {
          const {_id} = instance

          if (Reflect.has(instances, _id)) {
            FBLogger(`Already have "${_id}" -- continuing`)
          } else {
            Reflect.set(instances, _id, expandInstanceRef(instance))
          }
        })
    })

  FBLogger('... Done')

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
    sources.map((source) => annotateSource(source))
  )
}

module.exports = {
  merge
}
