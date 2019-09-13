const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const getDisplayValueStub = stub()

const updateControlDisplayValue = proxyquire('./update-control-display-value', {
  '../get-display-value/get-display-value': getDisplayValueStub
})

const setUserDataPropertyStub = stub()
const unsetUserDataPropertyStub = stub()
const getScopeStub = stub()

const userData = {
  setUserDataProperty: setUserDataPropertyStub,
  unsetUserDataProperty: unsetUserDataPropertyStub,
  getScope: getScopeStub
}

const resetStubs = () => {
  getDisplayValueStub.resetHistory()
  getDisplayValueStub.returns('display value')
  setUserDataPropertyStub.resetHistory()
  unsetUserDataPropertyStub.resetHistory()
  getScopeStub.resetHistory()
  getScopeStub.returns()
}

const nameInstance = {}
const pageInstance = {
  components: [
    nameInstance
  ]
}

test('When updating the display value for a control with an undefined value', t => {
  resetStubs()

  updateControlDisplayValue(pageInstance, userData, nameInstance, {
    controlName: 'foo'
  })
  t.ok(setUserDataPropertyStub.notCalled, 'it should not attempt to set the control’s display value')
  t.ok(unsetUserDataPropertyStub.calledOnce, 'it should unset the control’s display value')
  t.deepEqual(unsetUserDataPropertyStub.args[0], ['foo', 'display'], 'it should pass the expected args to the unset method')

  t.end()
})

test('When updating the display value for a control with a value', t => {
  resetStubs()

  updateControlDisplayValue(pageInstance, userData, nameInstance, {
    controlName: 'foo',
    nameValue: 'bar'
  })
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not attempt to unset the control’s display value')
  t.ok(setUserDataPropertyStub.calledOnce, 'it should set the control’s display value')
  t.deepEqual(setUserDataPropertyStub.args[0], ['foo', 'display value', 'display'], 'it should pass the expected args to the set method')

  t.end()
})

test('When updating the display value and the scope is explicitly input', t => {
  resetStubs()
  getScopeStub.returns('input')

  updateControlDisplayValue(pageInstance, userData, nameInstance, {
    controlName: 'foo',
    nameValue: 'bar'
  })
  t.ok(setUserDataPropertyStub.calledOnce, 'it should set the control’s display value')

  t.end()
})

test('When updating the display value and the scope is defined but not equal to input', t => {
  resetStubs()
  getScopeStub.returns('other')

  updateControlDisplayValue(pageInstance, userData, nameInstance, {
    controlName: 'foo',
    nameValue: 'bar'
  })
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not attempt to unset the control’s display value')
  t.ok(setUserDataPropertyStub.notCalled, 'it should not attempt to set the control’s display value')

  t.end()
})
