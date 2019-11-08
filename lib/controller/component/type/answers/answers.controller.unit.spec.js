const proxyquire = require('proxyquire')

const test = require('tape')
const sinon = require('sinon')

const getAnswersStub = {
  getAnswers: sinon.stub().returns('answers')
}

const getPageSummaryAnswersStub = {
  getPageSummaryAnswers: sinon.stub().returns('page summary answers')
}

const getSummaryListAnswersStub = {
  getSummaryListAnswers: sinon.stub().returns('summary list answers')
}

const {
  preUpdateContents
} = proxyquire('./answers.controller', {
  './answers.answers': getAnswersStub,
  './answers.page-summary': getPageSummaryAnswersStub,
  './answers.summary-list': getSummaryListAnswersStub
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

  t.equal(getAnswersStub.getAnswers.callCount, 1, 'getAnswers was called')
  t.equal(getPageSummaryAnswersStub.getPageSummaryAnswers.callCount, 1, 'getPageSummaryAnswers was called')
  t.equal(getSummaryListAnswersStub.getSummaryListAnswers.callCount, 1, 'getSummaryListAnswers was called')

  t.equal(componentInstance.answers, 'answers', 'Assigns answers array to field \'answers\' of the component instance')
  t.equal(componentInstance.pageSummaryAnswers, 'page summary answers', 'Assigns page summary answers array to field \'pageSummary\' of the component instance')
  t.equal(componentInstance.summaryListAnswers, 'summary list answers', 'Assigns summary list answers array to field \'summaryList\' of the component instance')

  t.end()
})
