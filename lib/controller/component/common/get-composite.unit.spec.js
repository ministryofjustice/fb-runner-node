require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getServiceSchemaStub = stub(serviceData, 'getServiceSchema')
const getCompositeStub = stub()
const getComponentControllerStub = stub().returns({
  getComposite: getCompositeStub
})

const getComponentComposite = proxyquire('./get-composite', {
  '~/fb-runner-node/service-data/service-data': getServiceSchemaStub,
  '~/fb-runner-node/controller/component/get-controller': getComponentControllerStub
})

getServiceSchemaStub.callsFake((_type) => {
  switch (_type) {
    case 'hasComposite':
      return {
        composite: ['a', 'b']
      }
    case 'hasCompositeController':
      return {
        composite: ['e', 'f']
      }
  }
})

test('An instance has a composite', (t) => {
  const hasStub = stub(Reflect, 'has').returns(true)
  const getStub = stub(Reflect, 'get').returns('mock component instance type')

  const mockServiceSchema = {}
  const mockComposite = []

  getServiceSchemaStub.returns(mockServiceSchema)

  getCompositeStub.returns(mockComposite)

  const componentInstance = {_type: 'noComposite'}

  const composite = getComponentComposite(componentInstance)

  const {
    args: [
      hasOne,
      hasTwo
    ]
  } = hasStub.getCall(0)

  const {
    args: [
      getOne,
      getTwo
    ]
  } = getStub.getCall(0)

  const {
    args: [
      one,
      two
    ]
  } = hasStub.getCall(1)

  const {
    args: [
      type
    ]
  } = getServiceSchemaStub.getCall(0)

  t.equal(hasOne, componentInstance, 'calls `Reflect.has` with the component instance')
  t.equal(hasTwo, '_type', 'calls `Reflect.has` with the component instance type key')

  t.equal(getOne, componentInstance, 'calls `Reflect.get` with the component instance')
  t.equal(getTwo, '_type', 'calls `Reflect.get` with the component instance type key')

  t.equal(type, 'mock component instance type', 'Calls `getServiceSchema` with the component instance type value')

  t.equal(one, mockServiceSchema, 'calls `Reflect.has` with the service schema')
  t.equal(two, 'composite', 'calls `Reflect.has` with the composite field key')

  t.equal(getComponentControllerStub.getCall(0).args[0], componentInstance, 'gets the controller for the component instance')

  t.equal(getCompositeStub.getCall(0).args[0], componentInstance, 'gets the composite from the controller')

  t.deepEqual(composite, mockComposite, 'returns the composite')

  getServiceSchemaStub.reset()
  getCompositeStub.reset()

  hasStub.restore()
  getStub.restore()

  t.end()
})

test('An instance does not have a composite', (t) => {
  const hasStub = stub(Reflect, 'has')

  hasStub.onCall(0).returns(true)
  hasStub.onCall(1).returns(false)

  const getStub = stub(Reflect, 'get').returns('mock component instance type')

  const mockServiceSchema = {}

  getServiceSchemaStub.returns(mockServiceSchema)

  const componentInstance = {_type: 'noComposite'}

  const composite = getComponentComposite(componentInstance)

  const {
    args: [
      hasOne,
      hasTwo
    ]
  } = hasStub.getCall(0)

  const {
    args: [
      getOne,
      getTwo
    ]
  } = getStub.getCall(0)

  const {
    args: [
      one,
      two
    ]
  } = hasStub.getCall(1)

  const {
    args: [
      type
    ]
  } = getServiceSchemaStub.getCall(0)

  t.equal(hasOne, componentInstance, 'calls `Reflect.has` with the component instance')
  t.equal(hasTwo, '_type', 'calls `Reflect.has` with the component instance type key')

  t.equal(getOne, componentInstance, 'calls `Reflect.get` with the component instance')
  t.equal(getTwo, '_type', 'calls `Reflect.get` with the component instance type key')

  t.equal(type, 'mock component instance type', 'Calls `getServiceSchema` with the component instance type value')

  t.equal(one, mockServiceSchema, 'calls `Reflect.has` with the service schema')
  t.equal(two, 'composite', 'calls `Reflect.has` with the composite field key')

  t.deepEqual(composite, undefined, 'returns undefined')

  hasStub.restore()
  getStub.restore()

  t.end()
})
