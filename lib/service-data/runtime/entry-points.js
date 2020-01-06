/**
 * @module entryPoints
 **/

function getPageKeys (instances) { return (key) => instances[key]._type.startsWith('page.') }

function isInstanceStepPageKey (instances, pageKey) {
  return (key) => {
    const {[key]: {steps}} = instances

    return Array.isArray(steps) && steps.includes(pageKey)
  }
}

function getInstanceStepForPageKey (instances, instanceKeys) {
  /*
   * we can also get `instanceKeys` from the enclosed function
   */
  return (pageKey) => !instanceKeys.some(isInstanceStepPageKey(instances, pageKey))
}

function getEntryPointKeys (instances) {
  const instanceKeys = Object.keys(instances)

  return instanceKeys
    .filter(getPageKeys(instances))
    .filter(getInstanceStepForPageKey(instances, instanceKeys))
}

function getEntryPointInstances (instances) {
  const entryPointKeys = getEntryPointKeys(instances)

  return entryPointKeys.reduce((accumulator, key) => ({...accumulator, [key]: instances[key]}), {})
}

module.exports = {
  getEntryPointKeys,
  getEntryPointInstances
}
