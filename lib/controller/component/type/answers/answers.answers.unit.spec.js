const proxyquire = require('proxyquire')

const test = require('tape')
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
  updateControlNames: {
    getRedactedValue: sinon.stub()
  },
  getDisplayValue: sinon.stub()
}

const formatStub = {
  format: sinon.stub()
}

const answersRepeatableStub = sinon.stub()

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

const getAnswers = proxyquire('./answers.answers', {
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

test('when invoking the answers component', async t => {
  formatStub.format.returnsArg(0)
  pageStub.skipPage.returnsArg(0)
  pageStub.setControlNames.returnsArg(0)
  pageStub.setRepeatable.returnsArg(0)
  pageStub.skipComponents.returnsArg(0)

  /**
   * Formatting answers for the answer bundle
   */
  pageStub.getDisplayValue.returns('<p>answer</p>')
  striptagsStub.returns('answer')
  userDataStub.getUserDataProperty.returns('machine answer')

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
