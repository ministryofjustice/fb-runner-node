const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const nodeCleanupStub = stub()

const fs = require('fs')

const existsSyncStub = stub(fs, 'existsSync')
existsSyncStub.callsFake(path => {
  return path.includes('already_exists')
})
const unlinkSyncStub = stub(fs, 'unlinkSync')

const cleanupGeneratedFiles = proxyquire('./sources-preinstall-cleanup-generated-files', {
  fs,
  'node-cleanup': nodeCleanupStub
})

const resetStubs = () => {
  existsSyncStub.resetHistory()
  unlinkSyncStub.resetHistory()
  nodeCleanupStub.resetHistory()
}

test('When no package file exists', t => {
  resetStubs()

  cleanupGeneratedFiles('service_package_path', 'service_package_lock_path')

  t.ok(nodeCleanupStub.calledOnce, 'it should register the cleanup handler')
  t.equal(nodeCleanupStub.getCall(0).args[0], cleanupGeneratedFiles.cleanup, 'it should have the registered cleanup handler as its cleanup property')

  t.end()
})

test('When executing the cleanup handler', t => {
  resetStubs()

  cleanupGeneratedFiles('service_package_path', 'service_package_lock_path')
  const cleanupHandler = cleanupGeneratedFiles.cleanup

  cleanupHandler()

  t.ok(unlinkSyncStub.calledTwice, 'it should delete 2 files')
  t.equal(unlinkSyncStub.getCall(0).args[0], 'service_package_path', 'it should delete the package.json file')
  t.equal(unlinkSyncStub.getCall(1).args[0], 'service_package_lock_path', 'it should delete the package-lock.json file')

  t.end()
})

test('When a package file already exists', t => {
  resetStubs()

  cleanupGeneratedFiles('service_package_path_already_exists', 'service_package_lock_path')

  t.ok(nodeCleanupStub.notCalled, 'it should not register the cleanup handler')
  t.equal(cleanupGeneratedFiles.cleanup, undefined, 'it should have no cleanup property')

  t.end()
})
