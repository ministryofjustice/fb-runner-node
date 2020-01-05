require('@ministryofjustice/module-alias/register-module')(module)

const {
  test
} = require('tap')

const sinon = require('sinon')

const proxyquire = require('proxyquire')

const getRedactedDisplayValueStub = sinon.stub()
const formatStub = sinon.stub()

const CommonController = proxyquire('.', {
  '~/fb-runner-node/redact/redact': getRedactedDisplayValueStub,
  '~/fb-runner-node/format/format': {
    format: formatStub
  }
})

test('Common Controller', (t) => {
  t.ok(new CommonController(), 'instantiates')

  t.end()
})

test('is multiline', (t) => {
  const commonController = new CommonController()

  t.equals(commonController.isMultiLine({multiline: true}), true, 'returns true when the component has a multiline field and the value is true')

  t.equals(commonController.isMultiLine({multiline: false}), false, 'returns false when the component has a multiline field and the value is false')

  t.equals(commonController.isMultiLine({}), false, 'returns false when the component does not have a multiline field')

  t.equals(commonController.isMultiLine({}, 'Yes\n\nYes'), true, 'returns true when the component value contains contiguous carriage return characters')

  t.equals(commonController.isMultiLine({}, 'No\nNo'), false, 'returns false when the component value does not contain contiguous carriage return characters')

  t.end()
})

test('is answered', (t) => {
  const getUserDataPropertyStub = sinon.stub()

  const commonController = new CommonController()

  const componentInstance = {
    name: 'mock component'
  }

  const userData = {
    getUserDataProperty: getUserDataPropertyStub
  }

  getUserDataPropertyStub.returns('mock user data property value')
  t.equal(commonController.isAnswered(componentInstance, userData), true, 'returns true when the answer is a non zero-length string')

  getUserDataPropertyStub.returns(0)
  t.equal(commonController.isAnswered(componentInstance, userData), true, 'returns true when the answer is a number')

  getUserDataPropertyStub.returns(false)
  t.equal(commonController.isAnswered(componentInstance, userData), true, 'returns true when the answer is a boolean')

  getUserDataPropertyStub.returns(undefined)
  t.equal(commonController.isAnswered(componentInstance, userData), false, 'returns false when the answer is undefined')

  getUserDataPropertyStub.returns(null)
  t.equal(commonController.isAnswered(componentInstance, userData), false, 'returns false when the answer is null')

  getUserDataPropertyStub.returns('')
  t.equal(commonController.isAnswered(componentInstance, userData), false, 'returns false when the answer is a zero-length string')

  t.ok(getUserDataPropertyStub.calledWith('mock component', undefined, undefined), 'gets the user data property value')

  t.end()
})

test('is redacted', (t) => {
  const commonController = new CommonController()

  t.equals(commonController.isRedacted({redacted: 'mock redacted pattern'}), true, 'returns true when the component has a redacted pattern')

  t.equals(commonController.isRedacted({}), false, 'returns false when the component does not have a redacted pattern')

  t.end()
})

test('get answered display value', (t) => {
  formatStub.reset()

  const getUserDataPropertyStub = sinon.stub().returns('mock user data property value')

  formatStub.returns('mock answered display value')

  const commonController = new CommonController()

  const componentInstance = {
    name: 'mock component name'
  }

  const userData = {
    getUserDataProperty: getUserDataPropertyStub,
    contentLang: 'mock content lang'
  }

  const isMultiLineStub = sinon.stub(commonController, 'isMultiLine').returns('mock multiline')

  t.equal(commonController.getAnsweredDisplayValue(componentInstance, userData), 'mock answered display value', 'returns the answered display value')

  t.ok(getUserDataPropertyStub.calledWith('mock component name', undefined, undefined), 'gets the user data property value')

  t.ok(formatStub.calledWith('mock user data property value', {}, {multiline: 'mock multiline', lang: 'mock content lang'}), 'gets the redacted display value')

  t.ok(isMultiLineStub.calledWith(componentInstance, 'mock user data property value'))

  t.end()
})

test('get redacted display value', (t) => {
  getRedactedDisplayValueStub.reset()

  const getUserDataPropertyStub = sinon.stub().returns('mock user data property value')

  getRedactedDisplayValueStub.returns('mock redacted display value')

  const commonController = new CommonController()

  const componentInstance = {
    name: 'mock component name',
    redact: 'mock redacted pattern'
  }

  const userData = {
    getUserDataProperty: getUserDataPropertyStub
  }

  t.equal(commonController.getRedactedDisplayValue(componentInstance, userData), 'mock redacted display value', 'returns the redacted display value')

  t.ok(getUserDataPropertyStub.calledWith('mock component name', undefined, undefined), 'gets the user data property value')

  t.ok(getRedactedDisplayValueStub.calledWith('mock user data property value', 'mock redacted pattern'), 'gets the redacted display value')

  t.end()
})

test('get not answered display value', (t) => {
  const commonController = new CommonController()

  t.equal(commonController.getNotAnsweredDisplayValue(), 'Not answered', 'returns ‘Not answered’')

  t.end()
})

test('get display value when the component is answered', (t) => {
  const commonController = new CommonController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredStub = sinon.stub(commonController, 'isAnswered').returns(true)
  const isRedactedStub = sinon.stub(commonController, 'isRedacted').returns(false)
  const getAnsweredDisplayValueStub = sinon.stub(commonController, 'getAnsweredDisplayValue').returns('mock answered display value')
  const getRedactedDisplayValueStub = sinon.stub(commonController, 'getRedactedDisplayValue')
  const getNotAnsweredDisplayValueStub = sinon.stub(commonController, 'getNotAnsweredDisplayValue')

  t.equal(commonController.getDisplayValue(componentInstance, userData), 'mock answered display value', 'returns the answered display value')

  t.ok(isAnsweredStub.calledWith(componentInstance, userData), 'calls `isAnswered`')
  t.ok(isRedactedStub.calledWith(componentInstance, userData), 'calls `isRedacted`')
  t.ok(getAnsweredDisplayValueStub.calledWith(componentInstance, userData), 'calls `getAnsweredDisplayValue`')
  t.ok(getRedactedDisplayValueStub.notCalled, 'does not call `getRedactedDisplayValue`')
  t.ok(getNotAnsweredDisplayValueStub.notCalled, 'does not call `getNotAnsweredDisplayValue`')

  t.end()
})

test('get display value when the component is answered and redacted', (t) => {
  const commonController = new CommonController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredStub = sinon.stub(commonController, 'isAnswered').returns(true)
  const isRedactedStub = sinon.stub(commonController, 'isRedacted').returns(true)
  const getAnsweredDisplayValueStub = sinon.stub(commonController, 'getAnsweredDisplayValue')
  const getRedactedDisplayValueStub = sinon.stub(commonController, 'getRedactedDisplayValue').returns('mock redacted display value')
  const getNotAnsweredDisplayValueStub = sinon.stub(commonController, 'getNotAnsweredDisplayValue')

  t.equal(commonController.getDisplayValue(componentInstance, userData), 'mock redacted display value', 'returns the redacted display value')

  t.ok(isAnsweredStub.calledWith(componentInstance, userData), 'calls `isAnswered`')
  t.ok(isRedactedStub.calledWith(componentInstance, userData), 'calls `isRedacted`')
  t.ok(getAnsweredDisplayValueStub.notCalled, 'does not call `getAnsweredDisplayValue`')
  t.ok(getRedactedDisplayValueStub.calledWith(componentInstance, userData), 'calls `getRedactedDisplayValue`')
  t.ok(getNotAnsweredDisplayValueStub.notCalled, 'does not call `getNotAnsweredDisplayValue`')

  t.end()
})

test('get display value when the component is not answered', (t) => {
  const commonController = new CommonController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredStub = sinon.stub(commonController, 'isAnswered').returns(false)
  const isRedactedStub = sinon.stub(commonController, 'isRedacted')
  const getAnsweredDisplayValueStub = sinon.stub(commonController, 'getAnsweredDisplayValue')
  const getRedactedDisplayValueStub = sinon.stub(commonController, 'getRedactedDisplayValue')
  const getNotAnsweredDisplayValueStub = sinon.stub(commonController, 'getNotAnsweredDisplayValue').returns('mock not answered display value')

  t.equal(commonController.getDisplayValue(componentInstance, userData), 'mock not answered display value', 'returns the not answered display value')

  t.ok(isAnsweredStub.calledWith(componentInstance, userData), 'calls `isAnswered`')
  t.ok(isRedactedStub.notCalled, 'does not call `isRedacted`')
  t.ok(getAnsweredDisplayValueStub.notCalled, 'does not call `getAnsweredDisplayValue`')
  t.ok(getRedactedDisplayValueStub.notCalled, 'does not call `getRedactedDisplayValue`')
  t.ok(getNotAnsweredDisplayValueStub.calledWith(componentInstance, userData), 'calls `getNotAnsweredDisplayValue`')

  t.end()
})
