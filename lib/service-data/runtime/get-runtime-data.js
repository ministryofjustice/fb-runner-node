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

function getRuntimeData (sources, schemas) {
  return loadJSON.load(sources)
    .then((sourceInstances) => {
      const mergedInstances = mergeInstances.merge(sourceInstances)
      const stepsInstances = propagateSteps.propagate(mergedInstances)
      const categoryInstances = propagateNamespace.propagate(stepsInstances, schemas)
      const showInstances = propagateShow.propagate(categoryInstances)
      const repeatableInstances = injectRepeatablePages.inject(showInstances)
      const instances = internationalizeRoutes.i18nUrls(repeatableInstances)

      instances.sourceInstances = {
        _type: 'sourceInstances',
        data: sourceInstances.reduce((accumulator, { source, instances = [] }) => {
          return {
            ...accumulator,
            [source]: instances.reduce((accumulator, instance) => {
              const { _id } = instance
              return {
                ...accumulator,
                [_id]: instance
              }
            }, {})
          }
        }, {})
      }
      return instances
    })
}

module.exports = {
  getRuntimeData
}
