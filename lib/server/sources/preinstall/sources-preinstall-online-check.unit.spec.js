const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const fs = require('fs-extra')
const existsSyncStub = stub(fs, 'existsSync')
existsSyncStub.callsFake(file => file.includes('exists'))
const removeSyncStub = stub(fs, 'removeSync')

const isOnlineStub = stub()

const preinstallSourcesOnlineCheck = proxyquire('./sources-preinstall-online-check', {
  'fs-extra': fs,
  'is-online': isOnlineStub
})

const resetStubs = () => {
  existsSyncStub.resetHistory()
  removeSyncStub.resetHistory()
  isOnlineStub.resetHistory()
}

test('When the platform env is set', async t => {
  resetStubs()

  await preinstallSourcesOnlineCheck('service_package_path', 'service_node_modules_path', 'plaftorm_env')

  t.ok(isOnlineStub.notCalled, 'it should not perform the online check')

  t.end()
})

test('When the platform env is not set', async t => {
  resetStubs()
  isOnlineStub.returns(true)

  await preinstallSourcesOnlineCheck('service_package_path', 'service_node_modules_path')

  t.ok(isOnlineStub.calledOnce, 'it should perform the online check')

  t.end()
})

test('When online and no package exists', async t => {
  resetStubs()
  isOnlineStub.returns(true)

  await preinstallSourcesOnlineCheck('missing_service_package_path', 'exists_service_node_modules_path')
  t.ok(removeSyncStub.calledOnce, 'it should remove any previously installed dependencies')
  t.equal(removeSyncStub.getCall(0).args[0], 'exists_service_node_modules_path', 'it should use the correct path to the previously installed dependencies')

  t.end()
})

test('When not online and dependencies have already been installed', async t => {
  resetStubs()
  isOnlineStub.returns(false)

  await preinstallSourcesOnlineCheck('missing_service_package_path', 'exists_service_node_modules_path')
  t.ok(removeSyncStub.notCalled, 'it should not remove any previously installed dependencies')

  t.end()
})

test('When not online and dependencies have not already been installed', async t => {
  resetStubs()
  isOnlineStub.returns(false)

  try {
    t.throws(await preinstallSourcesOnlineCheck('service_package_path', 'service_node_modules_path'), 'it should throw an error')
  } catch (e) {
    t.equal(e.name, 'FBServerError', 'it should throw an error of the correct type')
    t.equal(e.message, 'Service does not have its dependencies installed and there is no internet connection', 'it should report the correct error message')
  }

  resetStubs()
  try {
    t.throws(await preinstallSourcesOnlineCheck('exists_service_package_path', 'service_node_modules_path'), 'it should throw an error')
  } catch (e) {
    t.ok(true, 'it should throw an error regardless of whether the service package exists')
  }

  t.end()
})
