const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

const sinon = require('sinon')

const expectedAnswers = require('./answers.answers.unit.mock-data')

const jsonpathStub = {
  query: sinon.stub()
}

const striptagsStub = sinon.stub()
const lodashGetStub = sinon.stub()

const bytesStub = sinon.stub()
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
  setRepeatable: sinon.stub(),
  getDisplayValue: sinon.stub()
}

const formatStub = {
  format: sinon.stub()
}

const answersRepeatableStub = sinon.stub()

const userDataStub = {
  getUserDataProperty: sinon.stub(),
  getUserData: sinon.stub(),
  getScopedUserData: sinon.stub().returns({})
}

const {
  filterAnswers,
  reduceHeadings,
  getAnswers
} = proxyquire('./answers.answers', {
  jsonpath: jsonpathStub,
  striptags: striptagsStub,
  'lodash.get': lodashGetStub,
  bytes: bytesStub,
  '../../../../route/route': routeStub,
  '../../../../service-data/service-data': serviceDataStub,
  '../../../controller': controllerStub,
  '../../../../page/page': pageStub,
  '../../../../format/format': formatStub,
  './repeatable-actions/repeatable-actions': answersRepeatableStub
})

const answers = {answers: [{ }]}
const heading = {heading: 'Heading', level: 2}
const headingLevel33 = {heading: 'Heading', level: 33}
const headingLevel34 = {heading: 'Heading', level: 34}

test('When there are answers and headings and answers without answers', t => {
  {
    const answersWithoutAnswers = [{answers: []}, {answers: []}]
    const result = answersWithoutAnswers.filter(filterAnswers, [])

    t.deepEqual(result, [], 'it removes the answers without answers')
  }

  {
    const answersWithoutAnswers = [{answers: []}, answers, {answers: []}, heading]
    const result = answersWithoutAnswers.filter(filterAnswers, [])

    t.deepEqual(result, [answers, heading], 'it removes the answers without answers')
  }

  {
    const answersWithoutAnswers = [heading, {answers: []}, heading, {answers: []}]
    const result = answersWithoutAnswers.filter(filterAnswers, [])

    t.deepEqual(result, [heading, heading], 'it removes the answers without answers')
  }

  t.end()
})

test('When there are answers without headings', t => {
  {
    const singleAnswer = [answers]
    const result = singleAnswer.reduce(reduceHeadings, [])

    t.deepEqual(result, [answers], 'it returns the single answer')
  }

  {
    const multipleAnswers = [answers, answers, answers]
    const result = multipleAnswers.reduce(reduceHeadings, [])

    t.deepEqual(result, multipleAnswers, 'it returns multiple answers')
  }

  t.end()
})

test('When there is a single leading heading', t => {
  const answersWithSingleLeadingHeading = [heading, answers]
  const result = answersWithSingleLeadingHeading.reduce(reduceHeadings, [])

  t.deepEqual(result, [heading, answers], 'it returns both the leading heading and the answers')

  t.end()
})

test('When there is a single trailing heading', t => {
  const answersWithSingleTrailingHeading = [answers, heading]
  const result = answersWithSingleTrailingHeading.reduce(reduceHeadings, [])

  t.deepEqual(result, [answers], 'it removes the trailing heading and returns the answers')

  t.end()
})

test('When there are multiple trailing headings', t => {
  const answersWithMultipleTrailingHeadings = [answers, heading, heading, heading]
  const result = answersWithMultipleTrailingHeadings.reduce(reduceHeadings, [])

  t.deepEqual(result, [answers, heading], 'it returns both a single trailing heading and the answers')

  t.end()
})

test('When there are headings at different levels', t => {
  const input = [answers, headingLevel34, headingLevel33, headingLevel34, headingLevel33]
  const result = input.reduce(reduceHeadings, [])

  t.deepEqual(result, [answers, headingLevel34, headingLevel33, headingLevel34], 'it returns headings at different levels')

  t.end()
})

test('When invoking the answers component', async t => {
  formatStub.format.returnsArg(0)
  pageStub.skipPage.returnsArg(0)
  pageStub.setControlNames.returnsArg(0)
  pageStub.setRepeatable.returnsArg(0)
  pageStub.skipComponents.returnsArg(0)

  /**
   * Formatting answers for the answer bundle
   */
  pageStub.getDisplayValue.returns('answer value html')
  striptagsStub.returns('answer value text')
  userDataStub.getUserDataProperty.returns('answer value machine')

  routeStub.getNextPage.onCall(0).returns({
    heading: 'Heading for page 2',
    _id: 'page id 2'
  })

  routeStub.getNextPage.onCall(1).returns({
    _id: 'page id 3'
  })

  controllerStub.getInstanceController.returns({})

  serviceDataStub.getInstance.onCall(0).returns({
    heading: 'This is the pageHeading 1',
    _id: 'page id 1'
  })

  serviceDataStub.getInstance.onCall(1).returns({
    _id: 'page id 2'
  })

  serviceDataStub.getInstance.onCall(2).returns({
    _id: 'page id 3',
    $skipPage: true
  })

  serviceDataStub.getInstanceProperty.onCall(0).returns('This is the sectionHeadingSummary 1')

  serviceDataStub.getInstanceProperty.onCall(2).returns('This is the sectionHeadingSummary 2')

  serviceDataStub.getInstanceByPropertyValue.returns({
    _id: 'instance id'
  })

  serviceDataStub.getInstanceTitleSummary.onCall(0).returns('This is the instance title summary')

  const nameInstancesPage1 = [
    {
      _id: 'page id 1',
      _type: 'component type',
      name: 'component name'
    }
  ]

  const nameInstancesPage2 = [
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
      _type: 'fileupload',
      name: 'component name item 4',
      multiline: true
    }
  ]

  jsonpathStub.query.onCall(0).returns(nameInstancesPage1)
  jsonpathStub.query.onCall(1).returns(nameInstancesPage2)
  jsonpathStub.query.onCall(2).returns([])

  userDataStub.getUserData.returns({})

  bytesStub.returns('1Mb')

  serviceDataStub.getInstanceTitleSummary.callsFake(id => {
    const values = {
      'page id 1': 'This is the pageHeading 1'
    }
    return values[id]
  })

  userDataStub.getUserData.returnsArg(0)

  const componentInstance = {}
  const pageInstance = {
    url: '/page-url'
  }

  const answers = await getAnswers(
    componentInstance,
    userDataStub,
    pageInstance
  )

  t.equal(pageStub.skipPage.callCount, 3, 'skipPage was called the correct amount of times')

  t.equal(pageStub.setControlNames.callCount, 3, 'setControlNames was called the correct amount of times')

  t.equal(pageStub.setRepeatable.callCount, 3, 'setRepeatable was called the correct amount of times')

  t.equal(pageStub.skipComponents.callCount, 2, 'skipComponents was called twice for three pages')

  t.deepEqual(answers, expectedAnswers, 'answers should be correctly formed')

  t.end()
})
