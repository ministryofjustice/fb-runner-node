require('@ministryofjustice/module-alias/register-module')(module)

const {
  test
} = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const getDisplayValueStub = sinon.stub()
const getComponentControllerStub = sinon.stub().returns({ getDisplayValue: getDisplayValueStub })

const getDisplayValue = proxyquire('./get-display-value', {
  '~/fb-runner-node/controller/component/get-controller': getComponentControllerStub
})

test('get display value', (t) => {
  const nameInstance = {}
  const userData = {}

  getDisplayValueStub.returns('display value')

  const displayValue = getDisplayValue(userData, nameInstance)

  t.ok(getComponentControllerStub.calledWith(nameInstance), 'calls `getComponentController`')

  t.ok(getDisplayValueStub.calledWith(nameInstance, userData), 'calls `getDisplayValue`')

  t.equal(displayValue, 'display value', 'returns the display value')

  t.end()
})
