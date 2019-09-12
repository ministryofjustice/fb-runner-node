const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const redactStub = stub()

const updateControlValue = proxyquire('./update-control-value', {
  '../../redact/redact': redactStub
})

const getUserDataPropertyStub = stub()
const setUserDataPropertyStub = stub()
const unsetUserDataPropertyStub = stub()

const userData = {
  getUserDataProperty: getUserDataPropertyStub,
  setUserDataProperty: setUserDataPropertyStub,
  unsetUserDataProperty: unsetUserDataPropertyStub
}

const resetStubs = () => {
  redactStub.resetHistory()
  getUserDataPropertyStub.resetHistory()
  getUserDataPropertyStub.returns()
  setUserDataPropertyStub.resetHistory()
  unsetUserDataPropertyStub.resetHistory()
}

const nameInstance = {
  name: 'foo'
}
const redactedNameInstance = {
  name: 'foo',
  redact: '.#1234'
}
const pageInstance = {
  components: [
    nameInstance
  ]
}

test('When updating a control with an undefined value', t => {
  resetStubs()

  updateControlValue(pageInstance, userData, nameInstance, {
    controlName: 'foo'
  })
  t.ok(setUserDataPropertyStub.notCalled, 'it should not attempt to set the control’s value')
  t.ok(unsetUserDataPropertyStub.calledOnce, 'it should unset the control’s value')
  t.deepEqual(unsetUserDataPropertyStub.args[0], ['foo'], 'it should pass the expected args to the unset method')

  t.end()
})

test('When updating a composite control with an undefined value', t => {
  resetStubs()

  updateControlValue(pageInstance, userData, nameInstance, {
    controlName: 'foo',
    composite: ['a', 'b']
  })
  t.equal(unsetUserDataPropertyStub.callCount, 3, 'it should unset the control’s value')
  t.deepEqual(unsetUserDataPropertyStub.args, [['foo'], ['foo-a'], ['foo-b']], 'it should pass the expected args to the unset method')

  t.end()
})

test('When updating a control with a defined value', t => {
  resetStubs()

  updateControlValue(pageInstance, userData, nameInstance, {
    controlName: 'foo',
    nameValue: 'bar'
  })
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not attempt to unset the control’s value')
  t.ok(setUserDataPropertyStub.calledOnce, 'it should set the control’s value')
  t.deepEqual(setUserDataPropertyStub.args[0], ['foo', 'bar'], 'it should pass the expected args to the set method')

  t.end()
})

test('When updating a control with a falsy value', t => {
  resetStubs()

  updateControlValue(pageInstance, userData, nameInstance, {
    controlName: 'foo',
    nameValue: 0
  })
  t.ok(setUserDataPropertyStub.calledOnce, 'it should set the control’s value')
  t.deepEqual(setUserDataPropertyStub.args[0], ['foo', 0], 'it should pass the expected args to the set method')

  t.end()
})

test('When updating a control that should be redacted with a new value', t => {
  resetStubs()
  redactStub.returns('####1234')
  getUserDataPropertyStub.returns('previous')

  updateControlValue(pageInstance, userData, redactedNameInstance, {
    controlName: 'foo',
    nameValue: '12345678'
  })

  t.ok(redactStub.calledOnce, 'it should compare the value to be updated with the previous value')
  t.deepEqual(redactStub.args[0], ['previous', '.#1234'], 'it should call the redact method with the expected args')
  t.ok(setUserDataPropertyStub.calledOnce, 'it should set the control’s value')

  t.end()
})

test('When updating a control that should be redacted with the value it already has', t => {
  resetStubs()
  redactStub.returns('####1234')

  updateControlValue(pageInstance, userData, redactedNameInstance, {
    redact: '.#1234',
    controlName: 'foo',
    nameValue: '####1234'
  })
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not attempt to unset the control’s value')
  t.ok(setUserDataPropertyStub.notCalled, 'it should not attempt to set the control’s value')

  t.end()
})
