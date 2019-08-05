const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const fs = require('fs')
const existsSyncStub = stub(fs, 'existsSync')
existsSyncStub.callsFake(path => path.includes('exists'))
const writeFileSyncStub = stub(fs, 'writeFileSync')

const ensurePackage = proxyquire('./sources-preinstall-ensure-package', {
  fs
})

const resetStubs = () => {
  existsSyncStub.resetHistory()
  writeFileSyncStub.resetHistory()
}

test('When no package.json exists for a service', t => {
  resetStubs()

  const expectedPackageContents = `
{
  "dependencies": {
    "components_module": "components_version"
  }
}
`

  ensurePackage('/missing/package.json', 'components_module', 'components_version')

  t.deepEqual(writeFileSyncStub.getCall(0).args[0], '/missing/package.json', 'it should create a package.json file in the correct location')
  t.deepEqual(writeFileSyncStub.getCall(0).args[1], expectedPackageContents.trim(), 'it should create a package.json file with the correct values')

  t.end()
})

test('When package.json exists for a service', t => {
  resetStubs()

  ensurePackage('/exists/package.json')

  t.ok(writeFileSyncStub.notCalled, 'it should not overwrite the existing package.json file')

  t.end()
})
