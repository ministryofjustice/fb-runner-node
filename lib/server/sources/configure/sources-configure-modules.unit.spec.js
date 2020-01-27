const {
  test
} = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const debugStub = sinon.stub()
const logStub = sinon.stub()
const errorStub = sinon.stub()

debugStub.onCall(0).returns(logStub)
debugStub.onCall(1).returns(errorStub)

const cloneDeep = require('lodash.clonedeep')

const path = require('path')
const fs = require('fs')
const loadJsonFile = require('load-json-file')

const pathJoinSpy = sinon.spy(path, 'join')
const readdirSyncStub = sinon.stub(fs, 'readdirSync')
const writeFileSyncStub = sinon.stub(fs, 'writeFileSync')
const loadJsonFileSyncStub = sinon.stub(loadJsonFile, 'sync')

readdirSyncStub.returns(['module_a', 'module_b'])

loadJsonFileSyncStub.callsFake(file => {
  if (file.includes('missing')) {
    throw new Error(`${file} does not exist`)
  }

  if (file.includes('invalid')) {
    throw new Error(`${file} is invalid`)
  }

  // modules config
  if (file.includes('config.modules.json')) {
    const modulesJson = {
      _id: 'config.modules',
      _type: 'config.modules',
      modules: []
    }
    if (file.includes('registered')) {
      modulesJson.modules = [{
        _id: 'config.module.module_a',
        _type: 'config.module',
        enabled: 'on',
        module: 'module_a',
        title: 'Module A'
      }, {
        _id: 'config.module.module_b',
        _type: 'config.module',
        enabled: 'off',
        module: 'module_b',
        title: 'Module B'
      }]
    }
    if (file.includes('additional')) {
      modulesJson.modules = [{
        _id: 'config.module.module_a',
        _type: 'config.module',
        enabled: 'on',
        module: 'module_a',
        title: 'Module A'
      }, {
        _id: 'config.module.module_c',
        _type: 'config.module',
        enabled: 'on',
        module: 'module_c',
        title: 'Module C'
      }]
    }
    return modulesJson
  }
  // module package
  return {
    title: 'modulePackageTitle'
  }
})

const configureModules = proxyquire('./sources-configure-modules', {
  debug: debugStub,
  path,
  fs,
  loadJsonFile: {
    sync: loadJsonFileSyncStub
  }
})

const resetStubs = () => {
  pathJoinSpy.resetHistory()
  readdirSyncStub.resetHistory()
  writeFileSyncStub.resetHistory()
  loadJsonFileSyncStub.resetHistory()
}

const defaultModulesConfigContent = {
  _id: 'config.modules',
  _type: 'config.modules',
  modules: [
    {
      _id: 'config.module.module_a',
      _type: 'config.module',
      enabled: 'off',
      module: 'module_a',
      title: 'modulePackageTitle'
    },
    {
      _id: 'config.module.module_b',
      _type: 'config.module',
      enabled: 'off',
      module: 'module_b',
      title: 'modulePackageTitle'
    }
  ]
}

test('The service has no config.modules.json and no modules are enabled', t => {
  resetStubs()

  const serviceSources = configureModules('missing/service_config_path', 'runner_dir')

  t.deepEqual(serviceSources, [], 'it should return no service sources')
  t.ok(writeFileSyncStub.calledOnce, 'it should update config.modules.json')
  t.deepEqual(writeFileSyncStub.getCall(0).args[0], 'missing/service_config_path/config.modules.json', 'it should write the update config to the correct location')
  t.deepEqual(JSON.parse(writeFileSyncStub.getCall(0).args[1]), defaultModulesConfigContent, 'it should update the update config with the correct content')

  t.end()
})

test('The service has a config.modules.json but no modules are recorded in it', t => {
  resetStubs()

  const serviceSources = configureModules('exists/service_config_path', 'runner_dir')

  t.deepEqual(serviceSources, [], 'it should return no service sources')
  t.ok(writeFileSyncStub.calledOnce, 'it should update config.modules.json')
  t.deepEqual(JSON.parse(writeFileSyncStub.getCall(0).args[1]), defaultModulesConfigContent, 'it should update the update config with the correct content')

  t.end()
})

test('The service has a config.modules.json and all the modules are recorded in it', t => {
  resetStubs()

  const serviceSources = configureModules('registered/service_config_path', 'runner_dir')

  t.deepEqual(serviceSources, [{ source: 'module:module_a', sourcePath: 'runner_dir/lib/module/module_a', module: 'module_a' }], 'it should add enabled modules to service sources')
  t.ok(writeFileSyncStub.notCalled, 'it should not update config.modules.json')

  t.end()
})

test('The service has a config.modules.json recording modules that do not exist', t => {
  resetStubs()

  const expectedModulesConfigContent = cloneDeep(defaultModulesConfigContent)
  const moduleAConfig = expectedModulesConfigContent.modules[0]
  moduleAConfig.enabled = 'on'
  moduleAConfig.title = 'Module A'

  const serviceSources = configureModules('additional/service_config_path', 'runner_dir')

  t.deepEqual(serviceSources, [{ source: 'module:module_a', sourcePath: 'runner_dir/lib/module/module_a', module: 'module_a' }], 'it should not add modules to service sources if the modules do not exist even if enabled')
  t.ok(writeFileSyncStub.calledOnce, 'it should update config.modules.json')
  t.deepEqual(JSON.parse(writeFileSyncStub.getCall(0).args[1]), expectedModulesConfigContent, 'it should update the update config with the correct content')

  t.end()
})
