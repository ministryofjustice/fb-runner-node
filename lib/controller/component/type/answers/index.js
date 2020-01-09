require('@ministryofjustice/module-alias/register-module')(module)

const CommonController = require('~/fb-runner-node/controller/component/common')

const {
  getPageSummaryAnswers
} = require('./answers.page-summary')

const {
  getPageSummaryListAnswers
} = require('./answers.page-summary-list')

module.exports = class AnswersController extends CommonController {
  async preUpdateContents (componentInstance, ...args) {
    const pageSummaryAnswers = getPageSummaryAnswers(componentInstance, ...args)
    const pageSummaryListAnswers = getPageSummaryListAnswers(componentInstance, ...args)

    componentInstance.answers = pageSummaryAnswers
    componentInstance.answersList = pageSummaryListAnswers

    return componentInstance
  }
}
