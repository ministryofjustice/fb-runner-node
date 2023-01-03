const test = require('tape')
const { stub } = require('sinon')
const proxyquire = require('proxyquire')

const serviceSources = 'serviceSources'
const schemas = 'schemas'
const serviceData = 'serviceData'

const loadSchemasStub = stub()
loadSchemasStub.returns(schemas)

const loadMetadataStub = stub()
loadMetadataStub.returns(serviceData)

const loadSources = proxyquire('./sources-load', {
  './load/sources-load-schemas': loadSchemasStub,
  './load/sources-load-metadata': loadMetadataStub
})

test('When loading sources', async (t) => {
  const result = await loadSources(serviceSources)

  t.ok(loadSchemasStub.calledOnceWithExactly(serviceSources), 'it should use the service sources to load the schemas')
  t.ok(loadMetadataStub.calledOnceWithExactly(serviceSources), 'it should use the service sources to load the metadata')

  t.same(result, { schemas, serviceData }, 'it should return the loaded schemas and service data')

  t.end()
})
