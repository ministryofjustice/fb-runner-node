require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

const sinon = require('sinon')

const expectedAnswers = require('./answers.page-summary-list.unit.mock-data')

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
  getUserDataProperty: sinon.stub()
}

const isCurrentPageInstanceStub = sinon.stub()

const hasQuestionsStub = sinon.stub()
const hasMultipleQuestionsStub = sinon.stub()

const formatSectionHeadingStub = sinon.stub()

const getSubsequentPageStub = sinon.stub()

const getHeadingTextStub = sinon.stub()

const getQuestionInstancesStub = sinon.stub()

const populateParentDeletableAnswersStub = sinon.stub()
const populateParentAddableAnswersStub = sinon.stub()
const populateParentRepeatableHeadingAnswersStub = sinon.stub()
const populateRepeatableHeadingAnswersStub = sinon.stub()

const populateStepAddAnswersStub = sinon.stub()
const populateStepRemoveAnswersStub = sinon.stub()

const populateAnswerBucketStub = sinon.stub()

const getAnswerKeyStub = sinon.stub()
const getAnswerValueStub = sinon.stub()
const getChangeHrefStub = sinon.stub()
const getChangeTextStub = sinon.stub()
const getVisuallyHiddenTextStub = sinon.stub()

const createAnswerBucketStub = sinon.stub()

const {
  filterAnswers,
  reduceHeadings,
  getPageSummaryListAnswers
} = proxyquire('./answers.page-summary-list', {
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

    formatSectionHeading: formatSectionHeadingStub,

    getSubsequentPage: getSubsequentPageStub,

    getHeadingText: getHeadingTextStub,

    getQuestionInstances: getQuestionInstancesStub,

    getAnswerKey: getAnswerKeyStub,
    getAnswerValue: getAnswerValueStub,
    getChangeHref: getChangeHrefStub,
    getChangeText: getChangeTextStub,
    getVisuallyHiddenText: getVisuallyHiddenTextStub,

    createAnswerBucket: createAnswerBucketStub,

    populateParentDeletableAnswers: populateParentDeletableAnswersStub,
    populateParentAddableAnswers: populateParentAddableAnswersStub,
    populateParentRepeatableHeadingAnswers: populateParentRepeatableHeadingAnswersStub,
    populateRepeatableHeadingAnswers: populateRepeatableHeadingAnswersStub,

    populateStepAddAnswers: populateStepAddAnswersStub,
    populateStepRemoveAnswers: populateStepRemoveAnswersStub,

    populateAnswerBucket: populateAnswerBucketStub

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

test('Answers component', async t => {
  createAnswerBucketStub.reset()
  formatStub.format.reset()
  pageStub.skipPage.reset()
  pageStub.setControlNames.reset()
  pageStub.setRepeatable.reset()
  pageStub.skipComponents.reset()

  createAnswerBucketStub.callsFake(createAnswerBucketFake)
  formatStub.format.returnsArg(0)
  pageStub.skipPage.returnsArg(0)
  pageStub.setControlNames.returnsArg(0)
  pageStub.setRepeatable.returnsArg(0)
  pageStub.skipComponents.returnsArg(0)

  const subsequentPage2 = {
    heading: 'Heading for page 2', _id: 'page id 2'
  }

  const subsequentPage3 = {
    _id: 'page id 3'
  }

  const instancePage1 = {
    heading: 'This is the pageHeading 1', _id: 'page id 1'
  }

  const instancePage2 = {
    _id: 'page id 2'
  }

  const instancePage3 = {
    _id: 'page id 3', $skipPage: true
  }

  const instanceByPropertyValue = {
    _id: 'instance id'
  }

  getSubsequentPageStub.onCall(0).returns(subsequentPage2)

  getSubsequentPageStub.onCall(1).returns(subsequentPage3)

  controllerStub.getInstanceController.returns({})

  serviceDataStub.getInstance.onCall(0).returns(instancePage1)

  serviceDataStub.getInstance.onCall(1).returns(instancePage2)

  serviceDataStub.getInstance.onCall(2).returns(instancePage3)

  serviceDataStub.getInstanceProperty.onCall(0).returns('This is the sectionHeadingSummary 1')

  serviceDataStub.getInstanceProperty.onCall(2).returns('This is the sectionHeadingSummary 2')

  serviceDataStub.getInstanceByPropertyValue.returns(instanceByPropertyValue)

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
      $originalId: '$originalId'
    },
    {
      _id: 'page id 2 item 2',
      _type: 'component type',
      name: 'component name item 2'
    },
    {
      /*
       *  It's possible to add a `name` field to the instance JSON
       *  but checkboxes do not have one by default (or really know
       *  what to do with it)
       */
      _id: 'page id 2 item 3',
      _type: 'checkboxes',
      items: [{
        /*
         *  The `name` field for each checkbox input is in it's definition
         *  (it has an auto name by default)
         */
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

  formatSectionHeadingStub.onCall(0).returnsArg(1)
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

  const answers = await getPageSummaryListAnswers(
    componentInstance,
    userDataStub,
    pageInstance
  )

  t.equal(pageStub.skipPage.callCount, 3, 'calls `skipPage` three times')

  t.equal(pageStub.setControlNames.callCount, 3, 'calls `setControlNames` three times')

  t.equal(pageStub.setRepeatable.callCount, 3, 'calls `setRepeatable` three times')

  t.equal(pageStub.skipComponents.callCount, 2, 'calls `skipComponents` twice')

  t.equal(populateAnswerBucketStub.callCount, 5, 'calls `populateAnswerBucket` five times')

  const answerBucket = []

  const [questionInstance] = questionInstancesPage1

  t.same(populateAnswerBucketStub.getCall(0).args, [
    answerBucket,
    questionInstance,
    componentInstance,
    instanceByPropertyValue,
    instancePage1,
    userDataStub,
    pageInstance
  ], 'calls `populateAnswerBucket` with the expected arguments (question instances page 1, single component)')

  const [
    questionInstanceOne,
    questionInstanceTwo,
    questionInstanceThree,
    questionInstanceFour
  ] = questionInstancesPage2

  t.same(populateAnswerBucketStub.getCall(1).args, [
    answerBucket,
    questionInstanceOne,
    componentInstance,
    subsequentPage2,
    instancePage2,
    userDataStub,
    pageInstance
  ], 'calls `populateAnswerBucket` with the expected arguments (question instances page 2, component with `$originalId`)')

  t.same(populateAnswerBucketStub.getCall(2).args, [
    answerBucket,
    questionInstanceTwo,
    componentInstance,
    subsequentPage2,
    instancePage2,
    userDataStub,
    pageInstance
  ], 'calls `populateAnswerBucket` with the expected arguments (question instances page 2, any component except checkboxes)')

  t.same(populateAnswerBucketStub.getCall(3).args, [
    answerBucket,
    questionInstanceThree,
    componentInstance,
    subsequentPage2,
    instancePage2,
    userDataStub,
    pageInstance
  ], 'calls `populateAnswerBucket` with the expected arguments (question instances page 2, checkboxes component)')

  t.same(populateAnswerBucketStub.getCall(4).args, [
    answerBucket,
    questionInstanceFour,
    componentInstance,
    subsequentPage2,
    instancePage2,
    userDataStub,
    pageInstance
  ], 'calls `populateAnswerBucket` with the expected arguments (question instances page 2, upload component)')

  t.same(answers, expectedAnswers, 'answers should be correctly formed')

  t.end()
})
