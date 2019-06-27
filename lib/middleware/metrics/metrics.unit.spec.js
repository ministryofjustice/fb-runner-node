const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')

const promster = require('@promster/express')
const userDataStoreClient = require('../../client/user-datastore/user-datastore')
const userFileStoreClient = require('../../client/user-filestore/user-filestore')
const submitterClient = require('../../client/submitter/submitter')
const routeMetrics = () => {}

const metrics = proxyquire('./metrics', {
  '@promster/express': promster,
  './route-metrics': routeMetrics,
  '../../client/user-datastore/user-datastore': userDataStoreClient,
  '../../client/user-filestore/user-filestore': userFileStoreClient,
  '../../client/submitter/submitter': submitterClient
})

const initMetrics = (platformEnv, endpoint, accuracies) => {
  const createMiddlewareStub = stub(promster, 'createMiddleware')

  const appUseStub = stub()
  const app = {
    use: appUseStub,
    locals: {}
  }

  const histogramStub = stub()
  const prometheusStub = {
    Histogram: histogramStub
  }
  createMiddlewareStub.callsFake(() => {
    app.locals.Prometheus = prometheusStub
    return 'metrics-middleware'
  })
  const userDataStoreSetInstrumentationStub = stub(userDataStoreClient, 'setMetricsInstrumentation')
  const userFileStoreSetInstrumentationStub = stub(userFileStoreClient, 'setMetricsInstrumentation')
  const submitterSetInstrumentationStub = stub(submitterClient, 'setMetricsInstrumentation')

  const options = {}
  if (endpoint) {
    options.endpoint = endpoint
  }
  if (accuracies) {
    options.accuracies = accuracies
  }
  metrics.init(app, platformEnv, options)

  const resetStubs = () => {
    createMiddlewareStub.restore()
    userDataStoreSetInstrumentationStub.restore()
    userFileStoreSetInstrumentationStub.restore()
    submitterSetInstrumentationStub.restore()
  }
  return {
    app,
    prometheusStub,
    appUseStub,
    createMiddlewareStub,
    histogramStub,
    userDataStoreSetInstrumentationStub,
    userFileStoreSetInstrumentationStub,
    submitterSetInstrumentationStub,
    resetStubs
  }
}

test('When no platform env is passed to metrics init', t => {
  const {
    appUseStub,
    createMiddlewareStub,
    resetStubs
  } = initMetrics()

  t.notOk(createMiddlewareStub.called, 'it should not create the promster middleware')
  t.notOk(appUseStub.called, 'it should not use the promster middleware')

  resetStubs()
  t.end()
})

test('When platform env is passed to metrics init', t => {
  const {
    app,
    appUseStub,
    createMiddlewareStub,
    resetStubs
  } = initMetrics('platform')

  t.ok(createMiddlewareStub.calledOnce, 'it should create the promster middleware')
  t.deepEqual(createMiddlewareStub.getCall(0).args[0], {
    app,
    options: {
      endpoint: '/metrics',
      accuracies: ['ms']
    }
  }, 'it should invoke the createMiddleware function with the default options')

  t.ok(appUseStub.calledTwice, 'it should invoke the app use method twice')
  t.deepEqual(appUseStub.getCall(0).args, ['metrics-middleware'], 'it should use the returned metrics middleware')
  t.deepEqual(appUseStub.getCall(1).args, ['/metrics', routeMetrics], 'it should create a route to expose the metrics')

  resetStubs()
  t.end()
})

test('When custom options are passed to metrics init', t => {
  const {
    app,
    appUseStub,
    createMiddlewareStub,
    resetStubs
  } = initMetrics('platform', '/custom-metrics', ['ms', 'nanos'])

  t.deepEqual(createMiddlewareStub.getCall(0).args[0], {
    app,
    options: {
      endpoint: '/custom-metrics',
      accuracies: ['ms', 'nanos']
    }
  }, 'it should invoke the createMiddleware function with the custom options')

  t.deepEqual(appUseStub.getCall(1).args, ['/custom-metrics', routeMetrics], 'it should create a route to expose the metrics using the custom value')

  resetStubs()
  t.end()
})

test('When the metrics middleware is created', t => {
  const {
    histogramStub,
    userDataStoreSetInstrumentationStub,
    userFileStoreSetInstrumentationStub,
    submitterSetInstrumentationStub,
    resetStubs
  } = initMetrics('platform')

  const labelNames = ['client_name', 'base_url', 'url', 'method', 'status_code', 'status_message', 'error_name']
  const buckets = [0.1, 0.25, 0.5, 1, 2, 5, 10]

  t.ok(histogramStub.calledTwice, 'it should invoke the histogram class twice')

  t.deepEqual(histogramStub.getCall(0).args[0], {
    name: 'jwt_api_requests',
    help: 'API calls using FB JWT Client',
    labelNames,
    buckets
  }, 'it should call set up the api metrics with the correct values')

  t.deepEqual(histogramStub.getCall(1).args[0], {
    name: 'jwt_client_requests',
    help: 'HTTP requests using FB JWT Client',
    labelNames,
    buckets
  }, 'it should call set up the api metrics with the correct values')

  t.ok(userDataStoreSetInstrumentationStub.calledOnce, 'it should set the intrumentation on the FBUserDataStoreClient')
  t.ok(userFileStoreSetInstrumentationStub.calledOnce, 'it should set the intrumentation on the FBUserFileStoreClient')
  t.ok(submitterSetInstrumentationStub.calledOnce, 'it should set the intrumentation on the FBSubmitterClient')

  resetStubs()
  t.end()
})

test('When requesting the metrics client', t => {
  const {
    prometheusStub,
    resetStubs
  } = initMetrics('platform')

  const prometheusClient = metrics.getClient()

  t.equal(prometheusClient, prometheusStub, 'it should return the client')

  resetStubs()
  t.end()
})
