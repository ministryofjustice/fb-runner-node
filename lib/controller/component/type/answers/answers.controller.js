const {
  getAnswers
} = require('./answers.answers')

const {
  getPageSummaryAnswers
} = require('./answers.page-summary')

const {
  getSummaryListAnswers
} = require('./answers.summary-list')

async function preUpdateContents (componentInstance, userData, pageInstance) {
  const pageSummaryAnswers = getPageSummaryAnswers(componentInstance, userData, pageInstance)
  const summaryListAnswers = getSummaryListAnswers(componentInstance, userData, pageInstance)
  const answers = getAnswers(componentInstance, userData, pageInstance)

  componentInstance.pageSummaryAnswers = pageSummaryAnswers
  componentInstance.summaryListAnswers = summaryListAnswers
  componentInstance.answers = answers

  return componentInstance
}

module.exports = {
  preUpdateContents
}
