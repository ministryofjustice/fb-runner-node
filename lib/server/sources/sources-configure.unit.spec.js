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

const configureModulesStub = stub()
const configureSources = proxyquire('./sources-configure', {
  path,
  'load-json-file': loadJsonFile,
  './configure/sources-configure-modules': configureModulesStub
})

const resetStubs = () => {
  loadJsonFileSyncStub.resetHistory()
  configureModulesStub.resetHistory()
  configureModulesStub.returns([])
}

const defaultArgs = {
  APP_DIR: '/app_dir',
  RUNNER_DIR: '/runner_dir',
  PLATFORM_ENV: 'platform_env',
  SERVICE_PATH: '/service_path'
}

test('When configuring sources and no SERVICE_PATH is provided', async t => {
  resetStubs()

  try {
    t.throws(await configureSources())
  } catch (e) {
    t.equal(e.name, 'ServerError', 'it should throw an error of the correct type')
    t.equal(e.message, 'No SERVICE_PATH was provided', 'it should report the correct error message')
  }

  t.end()
})

test('When configuring sources', async t => {
  resetStubs()

  const {serviceSources} = await configureSources(defaultArgs)

  t.ok(configureModulesStub.calledOnce, 'it should determine any module')
  t.deepEqual(configureModulesStub.getCall(0).args, ['/service_path/metadata/config', '/runner_dir'], 'it should call configureModules with the correct args')

  t.deepEqual(serviceSources, [
    {source: 'govuk-frontend', sourcePath: path.resolve(process.env.PWD, 'node_modules/govuk-frontend/govuk')},
    {source: '@ministryofjustice/fb-components', sourcePath: path.resolve(process.env.PWD, 'node_modules/@ministryofjustice/fb-components')},
    {source: 'app', sourcePath: '/app_dir'},
    {source: 'service', sourcePath: '/service_path'}
  ], 'it should return the dependency, app and service sources')
  t.end()
})
