const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const app = 'app'
const serviceSources = 'serviceSources'
const locals = 'locals'
const schemas = 'schemas'
const serviceData = 'serviceData'
const router = 'router'
const options = {
  foo: 'bar'
}

const configureSourcesStub = stub()
configureSourcesStub.callsFake(async () => ({
  serviceSources,
  locals
}))
const loadSourcesStub = stub()
loadSourcesStub.callsFake(async () => ({
  schemas,
  serviceData
}))
const nunjucksConfigurationInitStub = stub()
const nunjucksConfiguration = {
  init: nunjucksConfigurationInitStub
}
const getRouterStub = stub()
getRouterStub.returns(router)

const initRunner = proxyquire('./server-init', {
  './sources/sources-configure': configureSourcesStub,
  './sources/sources-load': loadSourcesStub,
  '../middleware/nunjucks-configuration/nunjucks-configuration': nunjucksConfiguration,
  './server-router': getRouterStub
})

test('When setting up the runner', async t => {
  const runner = await initRunner(app, options)

  const configureSourcesStubArgs = configureSourcesStub.getCall(0).args
  const loadSourcesStubArgs = loadSourcesStub.getCall(0).args
  const nunjucksConfigurationInitStubArgs = nunjucksConfigurationInitStub.getCall(0).args
  const getRouterStubArgs = getRouterStub.getCall(0).args

  t.deepEqual(configureSourcesStubArgs, [options], 'it should pass the correct args to configureSources')
  t.deepEqual(loadSourcesStubArgs, [serviceSources, options], 'it should pass the correct args to loadSources')
  t.deepEqual(nunjucksConfigurationInitStubArgs, [app, serviceSources, options], 'it should pass the correct args to nunjucksConfiguration.init')
  t.deepEqual(getRouterStubArgs, [{
    foo: 'bar',
    schemas,
    serviceData,
    serviceSources,
    locals
  }], 'it should pass the correct args to getRouter')

  t.equal(runner, router, 'it should return the initialised runner router')

  t.end()
})
