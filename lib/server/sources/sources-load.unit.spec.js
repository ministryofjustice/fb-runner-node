const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const serviceSources = 'serviceSources'
const schemas = 'schemas'
const serviceData = 'serviceData'

const loadSchemasStub = stub()
loadSchemasStub.callsFake(async () => schemas)
const loadMetadataStub = stub()
loadMetadataStub.callsFake(async () => serviceData)
const loadControllersStub = stub()

const loadSources = proxyquire('./sources-load', {
  './load/sources-load-schemas': loadSchemasStub,
  './load/sources-load-metadata': loadMetadataStub,
  './load/sources-load-controllers': loadControllersStub
})

test('When loading sources', async t => {
  const result = await loadSources(serviceSources)
  t.ok(loadSchemasStub.calledOnceWithExactly(serviceSources), 'it should use the service sources to load the schemas')
  t.ok(loadMetadataStub.calledOnceWithExactly(serviceSources), 'it should use the service sources to load the metadata')
  t.ok(loadControllersStub.calledOnceWithExactly(serviceSources), 'it should use the service sources to load the controllers')
  t.deepEqual(result, {schemas, serviceData}, 'it should return the loaded schemas and service data')
  t.end()
})
