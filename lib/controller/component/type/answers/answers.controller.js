const getAnswers = require('./answers.answers')
const getPageSummary = require('./answers.page-summary')
const getSummaryList = require('./answers.summary-list')

async function preUpdateContents (componentInstance, userData, pageInstance) {
  const pageSummary = getPageSummary(componentInstance, userData, pageInstance)
  const summaryList = getSummaryList(componentInstance, userData, pageInstance)
  const answers = getAnswers(componentInstance, userData, pageInstance)

  componentInstance.pageSummary = pageSummary
  componentInstance.summaryList = summaryList
  componentInstance.answers = answers

  return componentInstance
}

module.exports = {
  preUpdateContents
}
