const proxyquire = require('proxyquire')

const test = require('tape')
const sinon = require('sinon')

const getPageSummaryAnswersStub = {
  getPageSummaryAnswers: sinon.stub().returns('page summary answers')
}

const getPageSummaryListAnswersStub = {
  getPageSummaryListAnswers: sinon.stub().returns('page summary list answers')
}

const {
  preUpdateContents
} = proxyquire('./answers.controller', {
  './answers.page-summary': getPageSummaryAnswersStub,
  './answers.page-summary-list': getPageSummaryListAnswersStub
})

test('When invoking the answers component', async t => {
  const componentInstance = {}
  const userData = {}
  const pageInstance = {
    url: '/page-url'
  }

  await preUpdateContents(
    componentInstance,
    userData,
    pageInstance
  )

  t.equal(getPageSummaryAnswersStub.getPageSummaryAnswers.callCount, 1, 'calls `getPageSummaryAnswers`')
  t.equal(getPageSummaryListAnswersStub.getPageSummaryListAnswers.callCount, 1, 'calls `getPageSummaryListAnswers`')

  t.equal(componentInstance.answers, 'page summary answers', 'Assigns page summary answers array to field \'answers\' of the component instance')
  t.equal(componentInstance.answersList, 'page summary list answers', 'Assigns page summary list answers array to field \'answersList\' of the component instance')

  t.end()
})
