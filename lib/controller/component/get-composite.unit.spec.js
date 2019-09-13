const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const serviceData = require('../../service-data/service-data')
const getServiceSchemaStub = stub(serviceData, 'getServiceSchema')
getServiceSchemaStub.callsFake(_type => {
  const schemas = {
    hasComposite: ['a', 'b'],
    hasCompositeAndController: ['e', 'f']
  }
  return schemas[_type] ? {
    composite: schemas[_type]
  } : {}
})

const controller = require('../../controller/controller')
const getInstanceControllerStub = stub(controller, 'getInstanceController')

const getComponentComposite = proxyquire('./get-composite', {
  '../../service-data/service-data': getServiceSchemaStub,
  '../../controller/controller': getInstanceControllerStub
})

const resetStubs = () => {
  getInstanceControllerStub.returns({})
}

test('When getting the composite for an instance which has none', t => {
  resetStubs()

  const composite = getComponentComposite({_type: 'noComposite'})
  t.deepEqual(composite, undefined, 'it should return undefined')

  t.end()
})

test('When getting the composite for an instance which has a composite defined its schema', t => {
  resetStubs()

  const composite = getComponentComposite({_type: 'hasComposite'})
  t.deepEqual(composite, ['a', 'b'], 'it should return the composite values defined in the schema')

  t.end()
})

test('When getting the composite for an instance which has a getComposite method on its controller', t => {
  resetStubs()
  getInstanceControllerStub.callsFake(() => ({
    getComposite: () => ['c', 'd']
  }))

  const composite = getComponentComposite({_type: 'hasCompositeController'})
  t.deepEqual(composite, ['c', 'd'], 'it should return the composite values returned by the getComposite method')

  t.end()
})

test('When getting the composite for an instance which has composite defined its schema and also has a getComposite method on its controller', t => {
  resetStubs()
  getInstanceControllerStub.callsFake(() => ({
    getComposite: () => ['g', 'h']
  }))

  const composite = getComponentComposite({_type: 'hasCompositeController'})
  t.deepEqual(composite, ['g', 'h'], 'it should return the composite values returned by the getComposite method')

  t.end()
})
