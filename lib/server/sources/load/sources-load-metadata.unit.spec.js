const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const fs = require('fs')
const existsSyncStub = stub(fs, 'existsSync')
existsSyncStub.callsFake(path => {
  return path.includes('exists')
})

const serviceData = require('../../../service-data/service-data')
const setServiceSourcesStub = stub(serviceData, 'setServiceSources')
const loadServiceDataStub = stub(serviceData, 'loadServiceData')
loadServiceDataStub.callsFake(async () => 'serviceData')

const loadSources = proxyquire('./sources-load-metadata', {
  fs,
  '../../../service-data/service-data': serviceData
})

const resetStubs = () => {
  existsSyncStub.resetHistory()
  setServiceSourcesStub.resetHistory()
  loadServiceDataStub.resetHistory()
}

test('When loading metadata from the sources provided', async t => {
  resetStubs()

  const data = await loadSources([{
    source: 'a',
    sourcePath: '/exists/a'
  }, {
    source: 'b',
    sourcePath: '/missing/b'
  }])

  const setServiceSourcesStubArgs = setServiceSourcesStub.getCall(0).args[0]

  t.ok(setServiceSourcesStub.calledOnce, 'it should set the metadata locations')
  t.deepEqual(setServiceSourcesStubArgs, [{source: 'a', path: '/exists/a/metadata'}], 'it should only register locations to load metadata from that exist')

  t.ok(loadServiceDataStub.calledOnce, 'it should load the metadata')

  t.deepEqual(data, 'serviceData', 'it should return the loaded metadata')

  t.end()
})
