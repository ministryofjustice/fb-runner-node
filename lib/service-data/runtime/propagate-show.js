/**
 * @module propagateShow
 **/

const jsonPath = require('jsonpath')
const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {getEntryPointKeys} = require('./entry-points')

/**
 * Create conditions object where all passed conditions must be met
 *
 * @param {array} condtions
 *  Array of conditions
 *
 * @return {object}
 *   Condtion object
 **/
function createAllConditions (...condtions) {
  const definedConditions = condtions.filter((condition) => condition !== undefined)

  if (!definedConditions.length) {
    return
  }

  if (definedConditions.length === 1) {
    return definedConditions[0]
  }

  const allOf = deepClone(definedConditions)
    .map((condition) => condition.all ? condition.all : condition)

  const all = [].concat(...allOf)

  // possible optimisation to push additonal conditions on to existing allOf
  // NB. but ensure to clone in this case
  // OTOH, why not do it by reference?
  return {
    _type: 'condition',
    all
  }
}

/**
 * Hoist show information from nested instances to step instance
 *
 * @param {object} instances
 *  Object of service instances keyed by id
 *
 * @return {object}
 *  Cloned object containing instances with propagated show info
 **/
const propagateInstanceConditions = (instances) => {
  instances = deepClone(instances)

  jsonPath.paths(instances, '$..["components","items"]')
    .reverse()
    .forEach((instancePath) => {
      const collectionType = instancePath.pop()
      // Not sure why jsonpath puts this value in the path array - but it does
      const collectionInstancePath = jsonPath.stringify(instancePath).replace(/\.value/, '')
      const [instance] = jsonPath.query(instances, collectionInstancePath)
      const instanceCollection = instance[collectionType]
      const shows = instanceCollection
        .map(({show}) => show)
        .filter((show) => show)

      // if all the items have a condition, the collection of items must satisfy at least one of them
      if (shows.length === instanceCollection.length) {
        // no need to match any if there's only one condition
        // Is there really a need for this optimisation though?

        let instanceShow

        if (shows.length === 1) {
          const [
            show
          ] = shows

          instanceShow = deepClone(show)
        } else {
          instanceShow = {
            _type: 'condition',
            any: deepClone(shows)
          }
        }

        instance.show = createAllConditions(instance.show, instanceShow)
      }
    })

  return instances
}

/**
 * Propagate show information through nested instances
 *
 * @param {object} instances
 *  Object of service instances keyed by id
 *
 * @return {object}
 *  Cloned object containing instances with propagated show info
 **/
function propagate (instances) {
  instances = deepClone(instances)

  const seen = {}

  /**
   * Recursively apply show conditions to steps
   *
   * @param {object} instance
   *  Instance object
   *
   * @return {undefined}
   *   Transforms are applied in place
   **/
  function propagateStepConditions (instance) {
    const {
      _id
    } = instance

    if (seen[_id]) {
      return
    }

    seen[_id] = true

    const {
      mountPoint,
      _parent,
      steps,
      showSteps
    } = instance

    if (mountPoint) {
      const mountPointInstance = instances[mountPoint]

      propagateStepConditions(mountPointInstance)

      if (mountPointInstance.show !== undefined) {
        instance.show = createAllConditions(mountPointInstance.show, instance.show)
      }
    }

    if (_parent) {
      propagateStepConditions(instances[_parent])
    }

    if (steps) {
      const allConditions = createAllConditions(instance.show, showSteps)

      instance.steps.forEach((step) => {
        const stepInstance = instances[step]
        if (allConditions) {
          stepInstance.show = createAllConditions(allConditions, stepInstance.show)
        }

        propagateStepConditions(stepInstance)
      })
    }
  }

  instances = propagateInstanceConditions(instances)

  const pageKeys = getEntryPointKeys(instances)

  pageKeys.forEach((key) => {
    const instance = instances[key]

    propagateStepConditions(instance)
  })

  return instances
}

module.exports = {
  propagate,
  propagateInstanceConditions
}
