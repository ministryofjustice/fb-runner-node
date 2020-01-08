/**
 * @module injectRepeatablePages
 **/

const jsonPath = require('jsonpath')
const cloneDeep = require('lodash.clonedeep')

const addRepeatablePages = (instances) => {
  const repeatablePages = jsonPath.query(instances, '$..[?(@.repeatable && @._type.startsWith("page."))]')
  repeatablePages.forEach(repeatablePage => {
    const stepId = repeatablePage._id

    const stepInstance = instances[stepId]
    if (stepInstance.heading) {
      stepInstance.heading += ` {param@${stepInstance.namespace}}`
    }

    jsonPath.apply(instances, `$..[?(@.steps && @.steps.includes("${stepId}"))]`, (value) => {
      const repeatableSummaryId = `${repeatablePage._id}.summary`
      let repeatableSummaryUrl = repeatablePage.url || `/${repeatablePage._id}`
      repeatableSummaryUrl = repeatableSummaryUrl.replace(/\/:[^/]+/, '')
      repeatableSummaryUrl += '/check'
      const repeatableSummary = {
        $autoInjected: true,
        _type: 'page.summary',
        _parent: repeatablePage._parent,
        _id: repeatableSummaryId,
        _repeatableId: repeatablePage._id,
        summaryOf: repeatablePage._id,
        url: repeatableSummaryUrl,
        heading: repeatablePage.repeatableHeading || 'Summary',
        show: repeatablePage.show
      }
      instances[repeatableSummaryId] = repeatableSummary

      const stepIndex = value.steps.indexOf(stepId)
      value.steps.splice(stepIndex + 1, 0, repeatableSummaryId)
      return value
    })
  })
  return instances
}

/**
 * Inject repeatables pages
 *
 * @param {object} instances
 *  Object of service instances keyed by id
 *
 * @return {object}
 *  Cloned object containing instances with repeatable pages
 **/
const inject = (instances) => {
  instances = cloneDeep(instances)
  const instancesWithRepeatables = addRepeatablePages(instances)
  return instancesWithRepeatables
}

module.exports = {
  inject
}
