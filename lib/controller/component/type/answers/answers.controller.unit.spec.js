const test = require('tape')
const sinon = require('sinon')
const rewiremock = require('rewiremock/node')

function initStubs () {
  const getScopedUserData = sinon.stub()
  getScopedUserData.callsFake(() => {
    return {}
  })
  const userDataStub = {
    getUserDataProperty: sinon.stub(),
    getUserData: sinon.stub(),
    getUserDataInputProperty: sinon.stub(),
    getScopedUserData
  }

  const stubs = {
    jsonpathStub: {
      query: sinon.stub()
    },
    lodashgetStub: sinon.stub(),
    bytesStub: sinon.stub(),
    routeStub: {
      getNextPage: sinon.stub(),
      getUrl: (...args) => args.toString()
    },
    serviceDataStub: {
      getInstanceByPropertyValue: sinon.stub(),
      getInstance: sinon.stub(),
      getInstanceProperty: sinon.stub(),
      getInstanceTitleSummary: sinon.stub()
    },
    controllerStub: {
      getInstanceController: sinon.stub()
    },
    pageStub: {
      skipPage: sinon.stub(),
      setControlNames: sinon.stub(),
      skipComponents: sinon.stub(),
      setRepeatable: sinon.stub(),
      updateControlNames: {
        getRedactedValue: sinon.stub()
      },
      getDisplayValue: sinon.stub()
    },
    formatStub: {
      format: sinon.stub()
    },
    answersRepeatableStub: sinon.stub()
  }

  stubs.answersRepeatableStub.returns({})
  stubs.pageStub.getDisplayValue.returns('answer')

  rewiremock.enable()

  rewiremock.isolation({
    noAutoPassBy: true
  })

  const stubConfig = {
    jsonpath: stubs.jsonpathStub,
    'lodash.get': stubs.lodashgetStub,
    bytes: stubs.bytesStub,
    '../../../../route/route': stubs.routeStub,
    '../../../../service-data/service-data': stubs.serviceDataStub,
    '../../../controller': stubs.controllerStub,
    '../../../../page/page': stubs.pageStub,
    '../../../../format/format': stubs.formatStub,
    './repeatable-actions/repeatable-actions': stubs.answersRepeatableStub
  }

  for (const [stubName, stubValue] of Object.entries(stubConfig)) {
    rewiremock(stubName).with(stubValue)
  }

  return {
    ...stubs,
    userDataStub
  }
}

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

test('when invoking the answers component', async t => {
  const {
    jsonpathStub,
    bytesStub,
    formatStub,
    pageStub,
    controllerStub,
    serviceDataStub,
    userDataStub,
    routeStub
  } = initStubs()

  const {preUpdateContents} = require('./answers.controller')

  formatStub.format.returnsArg(0)
  pageStub.skipPage.returnsArg(0)
  pageStub.setControlNames.returnsArg(0)
  pageStub.setRepeatable.returnsArg(0)
  pageStub.skipComponents.returnsArg(0)

  routeStub.getNextPage.onCall(0).returns({
    heading: 'Heading for page 2',
    _id: 'some_id_for_page_2'
  })

  routeStub.getNextPage.onCall(1).returns({
    _id: 'some_id_for_page_3'
  })

  controllerStub.getInstanceController.returns({})

  serviceDataStub.getInstance.onCall(0).returns({
    heading: 'This is a heading for page 1',
    _id: 'some_id'
  })

  serviceDataStub.getInstance.onCall(1).returns({
    _id: 'some_id_for_page_2'
  })

  serviceDataStub.getInstance.onCall(2).returns({
    _id: 'some_id_for_page_3',
    $skipPage: true
  })

  serviceDataStub.getInstanceProperty.onCall(0).returns('This is the sectionHeadingSummary')

  serviceDataStub.getInstanceProperty.onCall(2).returns('This is the sectionHeadingSummary 2')

  serviceDataStub.getInstanceByPropertyValue.returns({
    _id: 'abcde'
  })

  serviceDataStub.getInstanceTitleSummary.onCall(0).returns('this is the instance title summary')

  const nameInstancesPage1 = [{
    _id: 'some_id_page_1',
    _type: 'some_type_page_1',
    name: 'some name page 1'
  }]

  const nameInstancesPage2 = [{
    _id: 'some_id_page_2_item_1',
    _type: 'some_type_page_2_item_1',
    name: 'some_name_page_2_item_1',
    $originalId: '$originalId val'
  }, {
    _id: 'some_id_page_2_item_2',
    _type: 'some_type_page_2_item_2',
    name: 'some_name_page_2_item_2'
  }, {
    _id: 'some_id_page_2_item_3',
    _type: 'checkboxes',
    name: 'some_name_page_2_item_3',
    items: [{
      _id: 'checkbox_1',
      name: 'checkbox_1'
    }, {
      value: undefined
    }, {
      _id: 'checkbox_3',
      name: 'checkbox_3'
    }]
  }, {
    multiline: true,
    _type: 'fileupload',
    _id: 'some_id_page_2_item_4',
    name: 'some_name_page_2_item_4'
  }]

  jsonpathStub.query.onCall(0).returns(nameInstancesPage1)
  jsonpathStub.query.onCall(1).returns(nameInstancesPage2)
  jsonpathStub.query.onCall(2).returns([])

  userDataStub.getUserData.returns({
    someUserData: 'some user data value'
  })

  bytesStub.callsFake(() => {
    return '1Mb'
  })

  serviceDataStub.getInstanceTitleSummary.callsFake(id => {
    const values = {
      checkbox_1: 'Value for checkbox item 1',
      checkbox_3: 'Value for checkbox item 3 &'
    }
    return values[id]
  })
  userDataStub.getUserDataInputProperty.callsFake(name => {
    const values = {
      checkbox_1: 'yes',
      checkbox_3: 'yes'
    }
    return values[name]
  })
  pageStub.updateControlNames.getRedactedValue.callsFake(nameInstance => {
    const values = {
      some_name_page_2_item_1: 'the answer for a certain question &',
      some_name_page_2_item_4: [{
        originalname: 'Upload name value',
        size: 1024 * 1024
      }]
    }
    return values[nameInstance.name]
  })

  userDataStub.getUserData.returnsArg(0)

  const componentInstance = {}
  const pageInstance = {
    url: '/some_url'
  }

  const result = await preUpdateContents(
    componentInstance,
    userDataStub,
    pageInstance
  )

  const expectedAnswers = require('./answers-test-data-1')

  for (const method of ['skipPage', 'setControlNames', 'setRepeatable']) {
    const callCount = pageStub[method].callCount
    t.equal(callCount, 3, `${method} was called the correct amount of times`)
  }

  t.equal(pageStub.skipComponents.callCount, 2, 'skipComponents was called twice for three pages')

  t.equals(serviceDataStub.getInstanceTitleSummary.getCall(3).args[0], '$originalId val')

  t.deepEqual(result.answers, expectedAnswers.answers, 'answers should be correctly formed')

  t.end()
})
