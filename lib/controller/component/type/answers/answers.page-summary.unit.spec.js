require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

const sinon = require('sinon')

const expectedAnswers = require('./answers.page-summary.unit.mock-data')

const lodashGetStub = sinon.stub()

const routeStub = {
  getNextPage: sinon.stub(),
  getUrl: (...args) => args.toString()
}

const serviceDataStub = {
  getInstanceByPropertyValue: sinon.stub(),
  getInstance: sinon.stub(),
  getInstanceProperty: sinon.stub(),
  getInstanceTitleSummary: sinon.stub()
}

const controllerStub = {
  getInstanceController: sinon.stub()
}

const pageStub = {
  skipPage: sinon.stub(),
  setControlNames: sinon.stub(),
  skipComponents: sinon.stub(),
  setRepeatable: sinon.stub()
}

const formatStub = {
  format: sinon.stub()
}

const answersRepeatableStub = sinon.stub()

const userDataStub = {
  getUserData: sinon.stub().returns({}),
  getUserDataProperty: sinon.stub(),
  getUserDataInputProperty: sinon.stub()
}

const isCurrentPageInstanceStub = sinon.stub()

const hasQuestionsStub = sinon.stub()
const hasMultipleQuestionsStub = sinon.stub()

const formatSectionHeadingStub = sinon.stub()

const getQuestionTextStub = sinon.stub()
const getHeadingTextStub = sinon.stub()

const getSubsequentPageStub = sinon.stub()

const getQuestionInstancesStub = sinon.stub()

const populateParentDeletableAnswersStub = sinon.stub()
const populateParentAddableAnswersStub = sinon.stub()
const populateParentRepeatableHeadingAnswersStub = sinon.stub()
const populateRepeatableHeadingAnswersStub = sinon.stub()

const populateStepAddAnswersStub = sinon.stub()
const populateStepRemoveAnswersStub = sinon.stub()

const getAnswerKeyStub = sinon.stub()
const getAnswerValueStub = sinon.stub()
const getChangeHrefStub = sinon.stub()
const getChangeTextStub = sinon.stub()
const getVisuallyHiddenTextStub = sinon.stub()

const createAnswerBucketStub = sinon.stub()

const {
  filterAnswers,
  reduceHeadings,
  getPageSummaryAnswers
} = proxyquire('./answers.page-summary', {
  'lodash.get': lodashGetStub,
  '~/fb-runner-node/service-data/service-data': serviceDataStub,
  '~/fb-runner-node/route/route': routeStub,
  '~/fb-runner-node/page/page': pageStub,
  '~/fb-runner-node/format/format': formatStub,
  './repeatable-actions/repeatable-actions': answersRepeatableStub,
  './answers.common': {
    isCurrentPageInstance: isCurrentPageInstanceStub,

    hasQuestions: hasQuestionsStub,
    hasMultipleQuestions: hasMultipleQuestionsStub,

    getQuestionText: getQuestionTextStub,
    getHeadingText: getHeadingTextStub,

    formatSectionHeading: formatSectionHeadingStub,

    getSubsequentPage: getSubsequentPageStub,

    getQuestionInstances: getQuestionInstancesStub,

    populateParentDeletableAnswers: populateParentDeletableAnswersStub,
    populateParentAddableAnswers: populateParentAddableAnswersStub,
    populateParentRepeatableHeadingAnswers: populateParentRepeatableHeadingAnswersStub,
    populateRepeatableHeadingAnswers: populateRepeatableHeadingAnswersStub,

    populateStepAddAnswers: populateStepAddAnswersStub,
    populateStepRemoveAnswers: populateStepRemoveAnswersStub,

    getAnswerKey: getAnswerKeyStub,
    getAnswerValue: getAnswerValueStub,
    getChangeHref: getChangeHrefStub,
    getChangeText: getChangeTextStub,
    getVisuallyHiddenText: getVisuallyHiddenTextStub,

    createAnswerBucket: createAnswerBucketStub
  }
})

function createAnswerBucketFake (answers = []) {
  const answerBucket = []

  answers.push({
    answers: answerBucket
  })

  return answerBucket
}

const answers = { answers: [{ }] }
const heading = { heading: 'Heading', level: 2 }
const headingLevel33 = { heading: 'Heading', level: 33 }
const headingLevel34 = { heading: 'Heading', level: 34 }

test('When there are answers and headings and answers without answers', t => {
  {
    const answersWithoutAnswers = [{ answers: [] }, { answers: [] }]
    const result = answersWithoutAnswers.filter(filterAnswers, [])

    t.same(result, [], 'it removes the answers without answers')
  }

  {
    const answersWithoutAnswers = [{ answers: [] }, answers, { answers: [] }, heading]
    const result = answersWithoutAnswers.filter(filterAnswers, [])

    t.same(result, [answers, heading], 'it removes the answers without answers')
  }

  {
    const answersWithoutAnswers = [heading, { answers: [] }, heading, { answers: [] }]
    const result = answersWithoutAnswers.filter(filterAnswers, [])

    t.same(result, [heading, heading], 'it removes the answers without answers')
  }

  {
    const answersWithoutAnswers = [{}, {}, {}]
    const result = answersWithoutAnswers.filter(filterAnswers, [])

    t.same(result, [], 'it removes the answers without answers')
  }

  t.end()
})

test('When there are answers without headings', t => {
  {
    const singleAnswer = [answers]
    const result = singleAnswer.reduce(reduceHeadings, [])

    t.same(result, [answers], 'it returns the single answer')
  }

  {
    const multipleAnswers = [answers, answers, answers]
    const result = multipleAnswers.reduce(reduceHeadings, [])

    t.same(result, multipleAnswers, 'it returns multiple answers')
  }

  t.end()
})

test('When there is a single leading heading', t => {
  const answersWithSingleLeadingHeading = [heading, answers]
  const result = answersWithSingleLeadingHeading.reduce(reduceHeadings, [])

  t.same(result, [heading, answers], 'it returns both the leading heading and the answers')

  t.end()
})

test('When there is a single trailing heading', t => {
  const answersWithSingleTrailingHeading = [answers, heading]
  const result = answersWithSingleTrailingHeading.reduce(reduceHeadings, [])

  t.same(result, [answers], 'it removes the trailing heading and returns the answers')

  t.end()
})

test('When there are multiple trailing headings', t => {
  const answersWithMultipleTrailingHeadings = [answers, heading, heading, heading]
  const result = answersWithMultipleTrailingHeadings.reduce(reduceHeadings, [])

  t.same(result, [answers, heading], 'it returns both a single trailing heading and the answers')

  t.end()
})

test('When there are headings at different levels', t => {
  const input = [answers, headingLevel34, headingLevel33, headingLevel34, headingLevel33]
  const result = input.reduce(reduceHeadings, [])

  t.same(result, [answers, headingLevel34, headingLevel33, headingLevel34], 'it returns headings at different levels')

  t.end()
})

test('when invoking the answers component', async t => {
  createAnswerBucketStub.callsFake(createAnswerBucketFake)

  formatStub.format.returnsArg(0)
  pageStub.skipPage.returnsArg(0)
  pageStub.setControlNames.returnsArg(0)
  pageStub.setRepeatable.returnsArg(0)
  pageStub.skipComponents.returnsArg(0)

  getSubsequentPageStub.onCall(0).returns({
    heading: 'Heading for page 2', _id: 'page id 2'
  })

  getSubsequentPageStub.onCall(1).returns({
    _id: 'page id 3'
  })

  controllerStub.getInstanceController.returns({})

  serviceDataStub.getInstance.onCall(0).returns({
    heading: 'This is the pageHeading 1', _id: 'page id 1'
  })

  serviceDataStub.getInstance.onCall(1).returns({
    _id: 'page id 2'
  })

  serviceDataStub.getInstance.onCall(2).returns({
    _id: 'page id 3', $skipPage: true
  })

  serviceDataStub.getInstanceProperty.onCall(0).returns('This is the sectionHeadingSummary 1')

  serviceDataStub.getInstanceProperty.onCall(2).returns('This is the sectionHeadingSummary 2')

  serviceDataStub.getInstanceByPropertyValue.returns({
    _id: 'instance id'
  })

  serviceDataStub.getInstanceTitleSummary.onCall(0).returns('This is the instance title summary')

  const questionInstancesPage1 = [
    {
      _id: 'page id 1',
      _type: 'component type',
      name: 'component name'
    }
  ]

  const questionInstancesPage2 = [
    {
      _id: 'page id 2 item 1',
      _type: 'component type',
      name: 'component name item 1',
      $originalId: '$originalId val'
    },
    {
      _id: 'page id 2 item 2',
      _type: 'component type',
      name: 'component name item 2'
    },
    {
      _id: 'page id 2 item 3',
      _type: 'checkboxes',
      name: 'component name item 3',
      items: [{
        _id: 'checkbox 1',
        name: 'checkbox 1'
      },
      {
        value: undefined
      },
      {
        _id: 'checkbox 3',
        name: 'checkbox 3'
      }]
    },
    {
      _id: 'page id 2 item 4',
      _type: 'upload',
      name: 'component name item 4',
      multiline: true
    }
  ]

  getQuestionInstancesStub.onCall(0).returns(questionInstancesPage1)
  getQuestionInstancesStub.onCall(1).returns(questionInstancesPage2)
  getQuestionInstancesStub.onCall(2).returns([])

  populateParentDeletableAnswersStub.returns(false)
  populateParentAddableAnswersStub.returns(false)
  populateParentRepeatableHeadingAnswersStub.returns(false)
  populateRepeatableHeadingAnswersStub.returns(false)

  formatSectionHeadingStub.onCall(0).returns('This is the pageHeading 1')
  formatSectionHeadingStub.onCall(1).returns('This is the sectionHeadingSummary 1')
  formatSectionHeadingStub.onCall(3).returns('This is the sectionHeadingSummary 2')

  getHeadingTextStub.returns('This is the pageHeading 1')

  hasQuestionsStub.returns(true)

  getAnswerKeyStub.returns({
    html: 'answer key html',
    text: 'answer key text'
  })

  getAnswerValueStub.returns({
    html: 'answer value html',
    text: 'answer value text',
    machine: 'answer value machine'
  })

  getChangeHrefStub.returns('change href')
  getChangeTextStub.returns('change text')
  getVisuallyHiddenTextStub.returns('visually hidden text')

  const componentInstance = {}
  const pageInstance = {
    url: '/page-url'
  }

  const answers = await getPageSummaryAnswers(
    componentInstance,
    userDataStub,
    pageInstance
  )

  t.equal(pageStub.skipPage.callCount, 3, 'skipPage was called the correct amount of times')

  t.equal(pageStub.setControlNames.callCount, 3, 'setControlNames was called the correct amount of times')

  t.equal(pageStub.setRepeatable.callCount, 3, 'setRepeatable was called the correct amount of times')

  t.equal(pageStub.skipComponents.callCount, 2, 'skipComponents was called twice for three pages')

  t.same(answers, expectedAnswers, 'answers should be correctly formed')

  t.end()
})
