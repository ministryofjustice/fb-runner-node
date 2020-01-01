/**
 * @module getRuntimeData
 **/

const loadJSON = require('./load-json')
const mergeInstances = require('./merge-instances')
const propagateNamespace = require('./propagate-categories')
const propagateSteps = require('./propagate-steps')
const propagateShow = require('./propagate-show')
const injectRepeatablePages = require('./inject-repeatable-pages')
const internationalizeRoutes = require('./internationalize-routes')

const getRuntimeData = (sourceObjs, schemas) => {
  return loadJSON.load(sourceObjs)
    .then(sourceInstances => {
      const mergedInstances = mergeInstances.merge(sourceInstances)
      const stepsInstances = propagateSteps.propagate(mergedInstances)
      const categoryInstances = propagateNamespace.propagate(stepsInstances, schemas)
      const showInstances = propagateShow.propagate(categoryInstances)
      const repeatableInstances = injectRepeatablePages.inject(showInstances)
      const i18nRouteInstances = internationalizeRoutes.i18nUrls(repeatableInstances)
      const instances = i18nRouteInstances

      const sourceInstancesData = {}
      sourceInstances.forEach(sourceInstance => {
        const sourceInstanceObj = {}
        sourceInstance.instances.forEach(instance => {
          sourceInstanceObj[instance._id] = instance
        })
        sourceInstancesData[sourceInstance.source] = sourceInstanceObj
      })
      instances.sourceInstances = {
        _type: 'sourceInstances',
        data: sourceInstancesData
      }
      return instances
    })
}

module.exports = {
  getRuntimeData
}
