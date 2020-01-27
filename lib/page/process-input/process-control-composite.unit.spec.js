require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const { stub } = require('sinon')
const proxyquire = require('proxyquire')

const getCompositeValueStub = stub()
const getComponentControllerStub = stub()

getComponentControllerStub.returns({
  getCompositeValue: getCompositeValueStub
})

const processControlComposite = proxyquire('./process-control-composite', {
  '~/fb-runner-node/controller/component/get-controller': getComponentControllerStub
})

const getBodyInputStub = stub()
const setUserDataPropertyStub = stub()
const unsetUserDataPropertyStub = stub()

const userData = {
  getBodyInput: getBodyInputStub,
  setUserDataProperty: setUserDataPropertyStub,
  unsetUserDataProperty: unsetUserDataPropertyStub
}

const resetStubs = () => {
  getCompositeValueStub.resetHistory()
  getBodyInputStub.resetHistory()
  getBodyInputStub.returns({})
  setUserDataPropertyStub.resetHistory()
  unsetUserDataPropertyStub.resetHistory()
}

const pageInstance = {}
const nameInstance = {
  name: 'foo'
}
const options = {
  composite: ['a', 'b'],
  controlName: 'foo'
}

test('When all composite values for a composite control are missing', t => {
  resetStubs()

  getCompositeValueStub.returns(undefined)

  const value = processControlComposite(pageInstance, userData, nameInstance, options)

  t.ok(setUserDataPropertyStub.notCalled, 'it should not set the composite values')
  t.ok(unsetUserDataPropertyStub.called, 'it should unset the composite values')

  t.equal(value, undefined, 'it should return undefined')

  t.end()
})

test('When all composite values for a composite control exist', t => {
  resetStubs()

  getCompositeValueStub.returns('composite value')
  getBodyInputStub.returns({
    'foo-a': 'x',
    'foo-b': 'y'
  })

  const value = processControlComposite(pageInstance, userData, nameInstance, options)

  t.ok(setUserDataPropertyStub.calledTwice, 'it should set all the composite values')
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the composite values')

  t.deepEqual(setUserDataPropertyStub.args, [['foo-a', 'x'], ['foo-b', 'y']], 'it should set the composite values to the expected values')

  t.equal(value, 'composite value', 'it should return value provided by getCompositeValue method')

  t.end()
})

test('When a composite value for a composite control is missing', t => {
  resetStubs()

  getCompositeValueStub.returns('composite value')
  getBodyInputStub.returns({
    'foo-b': 'y'
  })

  const value = processControlComposite(pageInstance, userData, nameInstance, options)

  t.ok(setUserDataPropertyStub.calledOnce, 'it should set the valid composite values')
  t.ok(unsetUserDataPropertyStub.called, 'it should unset the invalid composite values')

  t.deepEqual(setUserDataPropertyStub.args, [['foo-b', 'y']], 'it should set the composite values to the expected values')

  t.equal(value, 'composite value', 'it should return value provided by getCompositeValue method')

  t.end()
})

test('When all composite values for a composite control are missing or invalid', t => {
  resetStubs()

  getCompositeValueStub.returns(undefined)
  getBodyInputStub.returns({
    'foo-b': ' '
  })

  const value = processControlComposite(pageInstance, userData, nameInstance, options)

  t.ok(setUserDataPropertyStub.notCalled, 'it should not set the composite values')
  t.ok(unsetUserDataPropertyStub.called, 'it should unset the composite values')

  t.equal(value, undefined, 'it should return undefined')

  t.end()
})
