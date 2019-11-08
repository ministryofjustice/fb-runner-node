const proxyquire = require('proxyquire')

const test = require('tape')
const sinon = require('sinon')

const getAnswersStub = sinon.stub().returns('answers')
const getPageSummaryAnswersStub = sinon.stub().returns('page summary answers')
const getSummaryListAnswersStub = sinon.stub().returns('summary list answers')

const {
  preUpdateContents
} = proxyquire('./answers.controller', {
  './answers.answers': getAnswersStub,
  './answers.page-summary': getPageSummaryAnswersStub,
  './answers.summary-list': getSummaryListAnswersStub
})

/*
const answers = {answers: true}
const heading = {heading: true, level: 33}
const headingLevel34 = {heading: true, level: 34}

test('When there are no headings', t => {
  initStubs()
  const {removeUnnecessaryHeadings} = require('./answers.controller')

  const singleAnswer = [answers]
  const singleResult = removeUnnecessaryHeadings(singleAnswer)
  t.deepEqual(singleResult, singleAnswer, 'it leave a single answer untouched')

  const manyAnswers = [answers, answers, answers]
  const multipleResult = removeUnnecessaryHeadings(manyAnswers)
  t.deepEqual(multipleResult, manyAnswers, 'it should leave many answers untouched')

  t.end()
})

test('When there is a trailing heading', t => {
  initStubs()
  const {removeUnnecessaryHeadings} = require('./answers.controller')

  const input = [answers, heading]
  const result = removeUnnecessaryHeadings(input)
  const expected = [answers]

  t.deepEqual(result, expected, 'it should remove the trailing heading')
  t.end()
})

test('When there are multiple headings', t => {
  initStubs()
  const {removeUnnecessaryHeadings} = require('./answers.controller')

  const input = [answers, heading, heading, heading]
  const result = removeUnnecessaryHeadings(input)
  const expected = [answers, heading]

  t.deepEqual(result, expected, 'it should remove multiple headings')
  t.end()
})

test('When there are headings of different levels', t => {
  initStubs()
  const {removeUnnecessaryHeadings} = require('./answers.controller')

  const input = [answers, headingLevel34, heading, headingLevel34, heading]
  const result = removeUnnecessaryHeadings(input)
  const expected = [answers, headingLevel34, heading, headingLevel34]
  t.deepEqual(result, expected, 'it should not treat them as duplicates')
  t.end()
})
*/

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

  t.equal(getAnswersStub.callCount, 1, 'getAnswers was called')
  t.equal(getPageSummaryAnswersStub.callCount, 1, 'getPageSummaryAnswers was called')
  t.equal(getSummaryListAnswersStub.callCount, 1, 'getSummaryListAnswers was called')

  t.equal(componentInstance.answers, 'answers', 'Assigns answers array to field \'answers\' of the component instance')
  t.equal(componentInstance.pageSummary, 'page summary answers', 'Assigns page summary answers array to field \'pageSummary\' of the component instance')
  t.equal(componentInstance.summaryList, 'summary list answers', 'Assigns summary list answers array to field \'summaryList\' of the component instance')

  t.end()
})
