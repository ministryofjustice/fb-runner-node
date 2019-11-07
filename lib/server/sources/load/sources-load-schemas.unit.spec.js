require('module-alias/register')

const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')
const path = require('path')

const loadJsonFile = require('load-json-file')
const loadJsonFileSyncStub = stub(loadJsonFile, 'sync')
loadJsonFileSyncStub.callsFake(sourcePath => {
  if (sourcePath.includes('idroot')) {
    return {
      specifications: {
        $idRoot: 'http://schema'
      }
    }
  }
  if (sourcePath.includes('specs')) {
    return {
      specifications: {}
    }
  }
  if (sourcePath.includes('exists')) {
    return {}
  }
  throw new Error('Could not load JSON')
})

const schemaUtilsLoadStub = stub()
schemaUtilsLoadStub.returns('schemas')

const schemaUtilsStub = stub()
schemaUtilsStub.callsFake(() => {
  const schemaUtils = {
    load: schemaUtilsLoadStub
  }
  return schemaUtils
})

const serviceData = require('~/service-data/service-data')
const setServiceSchemasStub = stub(serviceData, 'setServiceSchemas')

const loadSchemas = proxyquire('./sources-load-schemas', {
  'load-json-file': loadJsonFile,
  '@ministryofjustice/fb-specification/lib/schema-utils': schemaUtilsStub,
  '~/service-data/service-data': serviceData
})

const resetStubs = () => {
  loadJsonFileSyncStub.resetHistory()
  schemaUtilsLoadStub.resetHistory()
  schemaUtilsStub.resetHistory()
  setServiceSchemasStub.resetHistory()
}

test('When loading schemas from provided sources', async t => {
  resetStubs()

  const serviceSources = [{
    source: 'a',
    sourcePath: '/idroot/a'
  }, {
    source: 'b',
    sourcePath: '/specs/b'
  }, {
    source: 'c',
    sourcePath: '/exists/c'
  }, {
    source: 'd',
    sourcePath: '/unloadable/d'
  }]

  const schemas = await loadSchemas(serviceSources)

  const schemaUtilsStubArgs = schemaUtilsStub.getCall(0).args[0]

  t.equal(loadJsonFileSyncStub.getCalls().length, serviceSources.length, 'it should attempt to load the package.json for every source specified')
  t.equal(loadJsonFileSyncStub.getCall(0).args[0], path.join(serviceSources[0].sourcePath, 'package.json'), 'it should use the correct path to attempt to load the package.json')

  t.ok(schemaUtilsStub.calledOnce, 'it should set the schema locations')
  t.deepEqual(schemaUtilsStubArgs, [{$idRoot: 'http://schema', path: '/idroot/a'}], 'it should only register locations to load schema from that exist and have a defined $idRoot property')
  t.ok(schemaUtilsLoadStub.calledOnce, 'it should load the schemas')
  t.equal(schemas, 'schemas', 'it should return the loaded schemas')

  t.end()
})
