require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const bytesStub = sinon.stub()
const controller = require('~/fb-runner-node/controller/controller')
const serviceData = require('~/fb-runner-node/service-data/service-data')
const updateControlNames = require('~/fb-runner-node/page/update-control-names/update-control-names')
const format = require('~/fb-runner-node/format/format')

const getInstanceControllerStub = sinon.stub(controller, 'getInstanceController')
const getInstanceTitleSummaryStub = sinon.stub(serviceData, 'getInstanceTitleSummary')
const getRedactedValueStub = sinon.stub(updateControlNames, 'getRedactedValue')
const formatStub = sinon.stub(format, 'format')
const getUserDataInputPropertyStub = sinon.stub()
const userData = {
  contentLang: 'contentLang',
  getUserDataInputProperty: getUserDataInputPropertyStub
}

const getDisplayValue = proxyquire('./get-display-value', {
  bytes: bytesStub,
  '~/fb-runner-node/controller/controller': controller,
  '~/fb-runner-node/service-data/service-data': serviceData,
  '~/fb-runner-node/update-control-names/update-control-names': updateControlNames,
  '~/fb-runner-node/format/format': format
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

const nameInstance = {
  name: 'name'
}

test('When there is a value', t => {
  {
    resetStubs()

    const pageInstance = {skipRedact: true}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)

    t.equals(displayValue, 'display value', 'it returns the display value')
    t.ok(getRedactedValueStub.calledOnce, 'it calls `getRedactedValue` once')
    t.deepEqual(getRedactedValueStub.getCall(0).args, [nameInstance, userData, true, 'input'], 'it calls `getRedactedValue` with the expected args (`skipRedact` is true)')
  }

  {
    resetStubs()

    const pageInstance = {skipRedact: false}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)

    t.equals(displayValue, 'display value', 'it returns the display value')
    t.ok(getRedactedValueStub.calledOnce, 'it calls `getRedactedValue` once')
    t.deepEqual(getRedactedValueStub.getCall(0).args, [nameInstance, userData, false, 'input'], 'it calls `getRedactedValue` with the expected args (`skipRedact` is false)')
  }

  t.end()
})

test('When the value is undefined', t => {
  resetStubs()

  getRedactedValueStub.returns(undefined)

  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'Not answered', 'it returns \'Not answered\'')

  t.end()
})

test('When the value is null', t => {
  resetStubs()

  getRedactedValueStub.returns(null)

  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'Not answered', 'it returns \'Not answered\'')

  t.end()
})

test('When the value is a string', t => {
  resetStubs()

  {
    getRedactedValueStub.returns('')

    const pageInstance = {}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
    t.equals(displayValue, 'Not answered', 'it returns \'Not answered\'')
  }

  {
    getRedactedValueStub.returns('string value')

    const pageInstance = {}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
    t.equals(displayValue, 'string value', 'it returns a non-zero length string value')
  }

  t.end()
})

test('When the value is a number', t => {
  resetStubs()

  { // zero
    getRedactedValueStub.returns(0)

    const pageInstance = {}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
    t.equals(displayValue, 0, 'it returns 0')
  }

  { // greater than zero
    getRedactedValueStub.returns(1)

    const pageInstance = {}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
    t.equals(displayValue, 1, 'it returns 1')
  }

  { // less than zero
    getRedactedValueStub.returns(-1)

    const pageInstance = {}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
    t.equals(displayValue, -1, 'it returns -1')
  }

  t.end()
})

test('When the value is a boolean', t => {
  resetStubs()

  {
    getRedactedValueStub.returns(false)

    const pageInstance = {}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
    t.equals(displayValue, false, 'it returns false')
  }

  {
    getRedactedValueStub.returns(true)

    const pageInstance = {}

    const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
    t.equals(displayValue, true, 'it returns true')
  }

  t.end()
})

test('When there is no name', t => {
  resetStubs()

  const nameInstance = {}
  const pageInstance = {}

  getDisplayValue(pageInstance, userData, nameInstance)
  t.ok(getRedactedValueStub.notCalled, 'it does not call `getRedactedValue`')

  t.end()
})

test('When there is a `displayValue` method for the component type', t => {
  resetStubs()

  const getDisplayValueStub = sinon.stub()

  getDisplayValueStub.returns('component display value')

  getInstanceControllerStub.returns({
    getDisplayValue: getDisplayValueStub
  })

  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'component display value', 'it returns the component display value')
  t.ok(getDisplayValueStub.calledOnce, 'it calls the component\'s `getDisplayValue` method once')
  t.deepEqual(getDisplayValueStub.getCall(0).args, [nameInstance, userData, false], 'it calls the component\'s `getDisplayValue` method with the expected args')

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
    // no id
    _type: 'checkbox',
    name: 'buz',
    value: 'buzValue'
  }]
}

test('When the instance contains checkboxes with default values that have been selected', t => {
  resetStubs()

  getUserDataInputPropertyStub.returns('yes')

  const nameInstance = checkboxesInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'foo\n\nbar', 'it returns the labels for the selected values')
  t.ok(formatStub.calledOnce, 'it calls the component\'s `getDisplayValue` method once')
  t.deepEqual(formatStub.getCall(0).args, ['foo\n\nbar', {}, {
    substitution: true,
    markdown: true,
    multiline: true,
    lang: userData.contentLang
  }], 'it calls the `format` method with the expected args')

  t.end()
})

test('When the instance contains checkboxes that have been selected', t => {
  resetStubs()

  getUserDataInputPropertyStub.returns('bazValue')

  const nameInstance = checkboxesInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'baz', 'it returns the label for the value')

  t.end()
})

test('When the instance contains checkboxes without _ids that have been selected', t => {
  resetStubs()

  getUserDataInputPropertyStub.returns('buzValue')

  const nameInstance = checkboxesInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'buzValue', 'it returns the value')

  t.end()
})

test('When the instance contains checkboxes but none have been selected', t => {
  resetStubs()

  const nameInstance = checkboxesInstance
  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'Not answered', 'it returns \'Not answered\'')

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
  t.equals(displayValue, 'foo', 'it returns the labels for the selected value')
  t.ok(formatStub.calledOnce, 'it calls the component\'s `getDisplayValue` method once')
  t.deepEqual(formatStub.getCall(0).args, ['foo', {}, {
    substitution: true,
    markdown: false,
    multiline: false,
    lang: userData.contentLang
  }], 'it calls the format `method` with the expected args')

  t.end()
})

test('When the instance contains file uploads', t => {
  resetStubs()

  const uploadsInstance = {
    name: 'name',
    _type: 'fileupload'
  }

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
  t.equals(displayValue, 'foo (23 kb)\n\nbar (48 kb)', 'it returns all the file upload names and sizes')
  t.ok(formatStub.calledOnce, 'it calls the component\'s `getDisplayValue` method once')
  t.deepEqual(formatStub.getCall(0).args, ['foo (23 kb)\n\nbar (48 kb)', {}, {
    substitution: true,
    markdown: true,
    multiline: true,
    lang: userData.contentLang
  }], 'it calls the format `method` with the expected args')

  t.end()
})

test('When the instance contains MOJ file uploads', t => {
  resetStubs()

  const uploadsInstance = {
    name: 'name',
    _type: 'mojUpload'
  }

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
  t.equals(displayValue, 'foo (23 kb)\n\nbar (48 kb)', 'it returns all the file upload names and sizes')
  t.ok(formatStub.calledOnce, 'it calls the component\'s `getDisplayValue` method once')
  t.deepEqual(formatStub.getCall(0).args, ['foo (23 kb)\n\nbar (48 kb)', {}, {
    substitution: true,
    markdown: true,
    multiline: true,
    lang: userData.contentLang
  }], 'it calls the format `method` with the expected args')

  t.end()
})

test('When the instance contains an answer that has an array as its answer', t => {
  resetStubs()
  getRedactedValueStub.returns([
    'a',
    'b'
  ])

  const pageInstance = {}

  const displayValue = getDisplayValue(pageInstance, userData, nameInstance)
  t.equals(displayValue, 'a\n\nb', 'it concatentates all the answers')
  t.ok(formatStub.calledOnce, 'it calls the component\'s `getDisplayValue` method once')
  t.deepEqual(formatStub.getCall(0).args, ['a\n\nb', {}, {
    substitution: true,
    markdown: true,
    multiline: true,
    lang: userData.contentLang
  }], 'it calls the `format` method with the expected args')

  t.end()
})
