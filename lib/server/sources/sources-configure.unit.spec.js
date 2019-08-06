const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const path = require('path')

const loadJsonFile = require('load-json-file')
const loadJsonFileSyncStub = stub(loadJsonFile, 'sync')
loadJsonFileSyncStub.callsFake(file => {
  const json = {
    version: '3.0.1'
  }
  if (file.includes('pre-3')) {
    json.version = '2.13.0'
  }
  return json
})

const preinstallSourcesStub = stub()
const installSourcesStub = stub()
const configureDependenciesStub = stub()
const configureModulesStub = stub()

const configureSources = proxyquire('./sources-configure', {
  path,
  'load-json-file': loadJsonFile,
  './sources-preinstall': preinstallSourcesStub,
  './sources-install': installSourcesStub,
  './configure/sources-configure-dependencies': configureDependenciesStub,
  './configure/sources-configure-modules': configureModulesStub
})

const resetStubs = () => {
  loadJsonFileSyncStub.resetHistory()
  preinstallSourcesStub.resetHistory()
  installSourcesStub.resetHistory()
  configureModulesStub.resetHistory()

  configureDependenciesStub.returns([{
    source: 'a',
    sourcePath: '/path/to/a'
  }])
  configureModulesStub.returns([])
}

const defaultArgs = {
  APP_DIR: '/app_dir',
  RUNNER_DIR: '/runner_dir',
  PLATFORM_ENV: 'platform_env',
  COMPONENTS_MODULE: 'components_modules',
  COMPONENTS_VERSION: 'components_version',
  SERVICE_PATH: '/service_path'
}

test('When configuring sources and no SERVICE_PATH is provided', async t => {
  resetStubs()

  try {
    t.throws(await configureSources())
  } catch (e) {
    t.equal(e.name, 'FBServerError', 'it should throw an error of the correct type')
    t.equal(e.message, 'No value for SERVICEPATH (path to service metadata) provided', 'it should report the correct error message')
  }

  t.end()
})

test('When configuring sources', async t => {
  resetStubs()

  const {serviceSources, locals} = await configureSources(defaultArgs)

  t.ok(preinstallSourcesStub.calledOnce, 'it should run the pre-installation tasks')
  t.deepEqual(preinstallSourcesStub.getCall(0).args[0], {
    PLATFORM_ENV: 'platform_env',
    COMPONENTS_MODULE: 'components_modules',
    COMPONENTS_VERSION: 'components_version',
    servicePackagePath: '/service_path/package.json',
    serviceConfigPath: '/service_path/metadata/config',
    servicePackageLockPath: '/service_path/package-lock.json',
    serviceNodeModulesPath: '/service_path/node_modules',
    resolvedServicePath: '/service_path'
  }, 'it should call preinstallSources with the correct args')

  t.ok(installSourcesStub.calledOnce, 'it should install the dependencies')
  t.deepEqual(installSourcesStub.getCall(0).args[0], '/service_path', 'it should call installSources with the correct args')

  t.ok(configureDependenciesStub.calledOnce, 'it should determine any dependencies')
  t.deepEqual(configureDependenciesStub.getCall(0).args, ['/service_path/package.json', '/service_path/node_modules'], 'it should call configureDependencies with the correct args')

  t.ok(configureModulesStub.calledOnce, 'it should determine any module')
  t.deepEqual(configureModulesStub.getCall(0).args, ['/service_path/metadata/config', '/runner_dir'], 'it should call configureModules with the correct args')

  t.deepEqual(serviceSources, [{source: 'a', sourcePath: '/path/to/a'}, {source: 'app', sourcePath: '/app_dir'}, {source: 'service', sourcePath: '/service_path'}], 'it should return the dependency, app and service sources')
  t.equal(locals.govuk_frontend_version, undefined, 'it should return no value for govuk_frontend_version')

  t.end()
})

test('When configuring sources and enabled modules are found', async t => {
  resetStubs()
  configureModulesStub.returns([{
    module: 'module_a',
    source: 'module_a',
    sourcePath: '/path/to/module/a'
  }])

  const {serviceSources} = await configureSources(defaultArgs)

  t.deepEqual(serviceSources, [{source: 'a', sourcePath: '/path/to/a'}, {source: 'app', sourcePath: '/app_dir'}, {source: 'service', sourcePath: '/service_path'}, {module: 'module_a', source: 'module_a', sourcePath: '/path/to/module/a'}], 'it should return the sources with the modules appended')

  t.end()
})

test('When configuring sources including govuk-frontend (version 3.0.0 or later)', async t => {
  resetStubs()

  configureDependenciesStub.returns([{
    source: 'a',
    sourcePath: '/path/to/a'
  }, {
    source: 'govuk-frontend',
    sourcePath: '/govuk-frontend'
  }])

  const {serviceSources, locals} = await configureSources(defaultArgs)

  t.deepEqual(serviceSources, [{source: 'a', sourcePath: '/path/to/a'}, {source: 'govuk-frontend', sourcePath: '/govuk-frontend/govuk'}, {source: 'app', sourcePath: '/app_dir'}, {source: 'service', sourcePath: '/service_path'}], 'it should return the sources with the govuk-frontend path amended with gov suffix')
  t.equal(locals.govuk_frontend_version, '3.0.1', 'it should return the correct value for govuk_frontend_version')

  t.end()
})

test('When configuring sources including govuk-frontend (version 3.0.0 or later)', async t => {
  resetStubs()

  configureDependenciesStub.returns([{
    source: 'a',
    sourcePath: '/path/to/a'
  }, {
    source: 'govuk-frontend',
    sourcePath: '/govuk-frontend/pre-3'
  }])

  const {serviceSources, locals} = await configureSources(defaultArgs)

  t.deepEqual(serviceSources, [{source: 'a', sourcePath: '/path/to/a'}, {source: 'govuk-frontend', sourcePath: '/govuk-frontend/pre-3'}, {source: 'app', sourcePath: '/app_dir'}, {source: 'service', sourcePath: '/service_path'}], 'it should return the sources with the govuk-frontend path unamended')
  t.equal(locals.govuk_frontend_version, '2.13.0', 'it should return the correct value for govuk_frontend_version')

  t.end()
})
