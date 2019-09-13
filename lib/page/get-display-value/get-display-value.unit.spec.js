const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const bytesStub = stub()
const controller = require('../../controller/controller')
const serviceData = require('../../service-data/service-data')
const updateControlNames = require('../update-control-names/update-control-names')
const format = require('../../format/format')

const getInstanceControllerStub = stub(controller, 'getInstanceController')
const getInstanceTitleSummaryStub = stub(serviceData, 'getInstanceTitleSummary')
const getRedactedValueStub = stub(updateControlNames, 'getRedactedValue')
const formatStub = stub(format, 'format')
const getUserDataInputPropertyStub = stub()
const userData = {
  contentLang: 'contentLang',
  getUserDataInputProperty: getUserDataInputPropertyStub
}

const getDisplayValue = proxyquire('./get-display-value', {
  bytes: bytesStub,
  '../../controller/controller': controller,
  '../../service-data/service-data': serviceData,
  '../update-control-names/update-control-names': updateControlNames,
  '../../format/format': format
})

const resetStubs = () => {
  bytesStub.resetHistory()
  bytesStub.callsFake(size => `${size} kb`)
  getInstanceControllerStub.resetHistory()
  getInstanceControllerStub.returns({})
  getInstanceTitleSummaryStub.resetHistory()
  getInstanceTitleSummaryStub.callsFake(_id => _id)
  getRedactedValueStub.resetHistory()
  getRedactedValueStub.returns('display value')
  formatStub.resetHistory()
  formatStub.callsFake(input => input)
  getUserDataInputPropertyStub.resetHistory()
  getUserDataInputPropertyStub.returns()
}

test('When there is a simple value', t => {
  resetStubs()

  const nameInstance = {
    name: 'name'
  }
  const pageInstance = {
    skipRedact: 'skipRedact'
  }

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'display value', 'it should return that value')
  t.ok(getRedactedValueStub.calledOnce, 'it should call the getRedactedValue method once')
  t.deepEqual(getRedactedValueStub.getCall(0).args, [nameInstance, userData, pageInstance.skipRedact, 'input'], 'it should call the getRedactedValue method with the expected args')

  t.end()
})

test('When there is no value', t => {
  resetStubs()
  getRedactedValueStub.returns(undefined)

  const nameInstance = {
    name: 'name'
  }
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'Not answered', 'it should return the expected value for unanswered')

  t.end()
})

test('When there is no name', t => {
  resetStubs()
  getRedactedValueStub.returns(undefined)

  const nameInstance = {}
  const pageInstance = {}

  getDisplayValue(pageInstance, userData, nameInstance)
  t.ok(getRedactedValueStub.notCalled, 'it should not call the getRedactedValue method')

  t.end()
})

test('When there is a displayValue method for the component type', t => {
  resetStubs()
  const getDisplayValueStub = stub()
  getDisplayValueStub.returns('component display value')
  getInstanceControllerStub.returns({
    getDisplayValue: getDisplayValueStub
  })

  const nameInstance = {
    name: 'name'
  }
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'component display value', 'it should return the expected value for unanswered')
  t.ok(getDisplayValueStub.calledOnce, 'it should call the component’s getDisplayValue method once')
  t.deepEqual(getDisplayValueStub.getCall(0).args, [nameInstance, userData], 'it should call the component’s getDisplayValue method with the expected args')

  t.end()
})

const checkboxesInstance = {
  name: 'name',
  _type: 'checkboxes',
  items: [{
    _id: 'foo',
    _type: 'checkbox',
    name: 'foo'
  }, {
    _id: 'bar',
    _type: 'checkbox',
    name: 'bar'
  }, {
    _id: 'baz',
    _type: 'checkbox',
    name: 'baz',
    value: 'bazValue'
  }, {
    _type: 'checkbox',
    name: 'loofah',
    value: 'loofahValue'
  }]
}

test('When the instance contains checkboxes that have been selected', t => {
  resetStubs()
  getUserDataInputPropertyStub.returns('yes')
  const nameInstance = checkboxesInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'foo\n\nbar', 'it should return the labels for the selected values')
  t.ok(formatStub.calledOnce, 'it should call the component’s getDisplayValue method once')
  t.deepEqual(formatStub.getCall(0).args, ['foo\n\nbar', {}, {
    substitution: true,
    multiline: true,
    lang: userData.contentLang
  }], 'it should call the format method with the expected args')

  t.end()
})

test('When the instance contains checkboxes with non-yes values that have been selected', t => {
  resetStubs()
  getUserDataInputPropertyStub.returns('bazValue')
  const nameInstance = checkboxesInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'baz', 'it should return the labels for those selected values')

  t.end()
})

test('When the instance contains checkboxes without _ids that have been selected', t => {
  resetStubs()
  getUserDataInputPropertyStub.returns('loofahValue')
  const nameInstance = checkboxesInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'loofahValue', 'it should return the actual value for those selected values')

  t.end()
})

test('When the instance contains checkboxes but none have been selected', t => {
  resetStubs()

  const nameInstance = checkboxesInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'None', 'it should return the expected value for nothing selected')

  t.end()
})

const radiosInstance = {
  name: 'name',
  _type: 'radios',
  items: [{
    _id: 'foo',
    _type: 'radio',
    value: 'foo'
  }, {
    _id: 'bar',
    _type: 'radio',
    value: 'bar'
  }, {
    _id: 'baz',
    _type: 'radio',
    value: 'baz'
  }]
}

test('When the instance contains item (radios or selects) that has been selected', t => {
  resetStubs()
  getRedactedValueStub.returns('foo')
  const nameInstance = radiosInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'foo', 'it should return the labels for the selected value')
  t.ok(formatStub.calledOnce, 'it should call the component’s getDisplayValue method once')
  t.deepEqual(formatStub.getCall(0).args, ['foo', {}, {
    substitution: true,
    multiline: false,
    lang: userData.contentLang
  }], 'it should call the format method with the expected args')

  t.end()
})

const uploadsInstance = {
  name: 'name',
  _type: 'fileupload'
}

test('When the instance contains file uploads', t => {
  resetStubs()
  getRedactedValueStub.returns([{
    originalname: 'foo',
    size: '23'
  }, {
    originalname: 'bar',
    size: '48'
  }])
  const nameInstance = uploadsInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'foo (23 kb)\n\nbar (48 kb)', 'it should return all the file upload names and sizes')
  t.ok(formatStub.calledOnce, 'it should call the component’s getDisplayValue method once')
  t.deepEqual(formatStub.getCall(0).args, ['foo (23 kb)\n\nbar (48 kb)', {}, {
    substitution: undefined,
    multiline: true,
    lang: userData.contentLang
  }], 'it should call the format method with the expected args')

  t.end()
})

test('When the instance contains an answer that has an array as its answer', t => {
  resetStubs()
  getRedactedValueStub.returns([
    'a',
    'b'
  ])
  const nameInstance = {
    name: 'name'
  }
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'a\n\nb', 'it should concatentate all the answer items')
  t.ok(formatStub.calledOnce, 'it should call the component’s getDisplayValue method once')
  t.deepEqual(formatStub.getCall(0).args, ['a\n\nb', {}, {
    substitution: undefined,
    multiline: false,
    lang: userData.contentLang
  }], 'it should call the format method with the expected args')

  t.end()
})
