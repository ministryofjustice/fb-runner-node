const test = require('tape')
const {stub, spy} = require('sinon')
const proxyquire = require('proxyquire')

const path = require('path')
const pathJoinSpy = spy(path, 'join')
const fs = require('fs')
const writeFileSyncStub = stub(fs, 'writeFileSync')
const loadJsonFile = require('load-json-file')
const loadJsonFileSyncStub = stub(loadJsonFile, 'sync')
loadJsonFileSyncStub.callsFake(file => {
  const json = {
    foo: 'bar'
  }
  if (file.includes('isa')) {
    json._isa = 'has_isa'
  }
  return json
})

const updateService = proxyquire('./sources-preinstall-update-service-config', {
  path,
  fs,
  'load-json-file': loadJsonFile
})

const resetStubs = () => {
  pathJoinSpy.resetHistory()
  writeFileSyncStub.resetHistory()
  loadJsonFileSyncStub.resetHistory()
}

test('When updating the config file for a service', t => {
  resetStubs()

  const expectedServiceConfigPath = path.join('/somewhere', 'service.json')

  updateService('/somewhere', 'components_module')

  t.deepEqual(loadJsonFileSyncStub.getCall(0).args[0], expectedServiceConfigPath, 'it should check the correct service.json path')

  t.end()
})

test('When service already has an _isa property', t => {
  resetStubs()

  updateService('/isa', 'components_module')

  t.ok(writeFileSyncStub.notCalled, 'it should not update the existing service.json file')

  t.end()
})

test('When service already has an _isa property', t => {
  resetStubs()

  const expectedServiceConfigPath = path.join('/missing', 'service.json')
  const expectedServiceConfigJSON = `
{
  "foo": "bar",
  "_isa": "components_module=>service"
}
`

  updateService('/missing', 'components_module')

  t.ok(writeFileSyncStub.calledOnce, 'it should update the existing service.json file')
  t.deepEqual(writeFileSyncStub.getCall(0).args[0], expectedServiceConfigPath, 'it should write the changes back to the service.json path')
  t.deepEqual(writeFileSyncStub.getCall(0).args[1], expectedServiceConfigJSON.trim(), 'it should write the correct changes to the service config')

  t.end()
})
