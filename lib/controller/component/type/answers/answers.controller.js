const {
  getPageSummaryAnswers
} = require('./answers.page-summary')

const {
  getPageSummaryListAnswers
} = require('./answers.page-summary-list')

async function preUpdateContents (componentInstance, userData, pageInstance) {
  const pageSummaryAnswers = getPageSummaryAnswers(componentInstance, userData, pageInstance)
  const pageSummaryListAnswers = getPageSummaryListAnswers(componentInstance, userData, pageInstance)

  componentInstance.answers = pageSummaryAnswers
  componentInstance.answersList = pageSummaryListAnswers

  return componentInstance
}

module.exports = {
  preUpdateContents
}
