const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const controller = require('../../controller/controller')
const getCompositeValueStub = stub()
const getInstanceControllerStub = stub(controller, 'getInstanceController')
getInstanceControllerStub.returns({
  getCompositeValue: getCompositeValueStub
})

const processControlComposite = proxyquire('./process-control-composite', {
  '../../controller/controller': controller
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
  getCompositeValueStub.returns('composite value')
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

  const value = processControlComposite(pageInstance, userData, nameInstance, options)

  t.ok(setUserDataPropertyStub.notCalled, 'it should not set the composite values')
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the composite values')

  t.equal(value, undefined, 'it should return undefined')

  t.end()
})

test('When all composite values for a composite control exist', t => {
  resetStubs()
  getBodyInputStub.returns({
    'foo-a': 'x',
    'foo-b': 'y'
  })

  const value = processControlComposite(pageInstance, userData, nameInstance, options)

  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the composite values')
  t.ok(setUserDataPropertyStub.calledTwice, 'it should set all the composite values')
  t.deepEqual(setUserDataPropertyStub.args, [['foo-a', 'x'], ['foo-b', 'y']], 'it should set the composite values to the expected values')

  t.equal(value, 'composite value', 'it should return value provided by getCompositeValue method')

  t.end()
})

test('When a composite value for a composite control is missing', t => {
  resetStubs()
  getBodyInputStub.returns({
    'foo-b': 'y'
  })

  const value = processControlComposite(pageInstance, userData, nameInstance, options)

  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the composite values')
  t.ok(setUserDataPropertyStub.calledOnce, 'it should set only the valid composite values')
  t.deepEqual(setUserDataPropertyStub.args, [['foo-b', 'y']], 'it should set the composite values to the expected values')

  t.equal(value, 'composite value', 'it should return value provided by getCompositeValue method')

  t.end()
})

test('When all composite values for a composite control are missing or invalid', t => {
  resetStubs()
  getBodyInputStub.returns({
    'foo-b': ' '
  })

  const value = processControlComposite(pageInstance, userData, nameInstance, options)

  t.ok(unsetUserDataPropertyStub.calledOnce, 'it should not unset the composite values')
  t.ok(setUserDataPropertyStub.notCalled, 'it should not unset the composite values')

  t.equal(value, undefined, 'it should return undefined')

  t.end()
})
