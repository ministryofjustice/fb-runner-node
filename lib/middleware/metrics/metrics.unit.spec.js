const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')

const promster = require('@promster/express')
const routeMetrics = () => {}

const metrics = proxyquire('./metrics', {
  '@promster/express': promster,
  './route-metrics': routeMetrics
})

const initMetrics = (endpoint, accuracies) => {
  const createMiddlewareStub = stub(promster, 'createMiddleware')

  const appUseStub = stub()
  const app = {
    use: appUseStub,
    locals: {}
  }

  const prometheusStub = {}
  createMiddlewareStub.callsFake(() => {
    app.locals.Prometheus = prometheusStub
    return 'metrics-middleware'
  })

  const options = {}
  if (endpoint) {
    options.endpoint = endpoint
  }
  if (accuracies) {
    options.accuracies = accuracies
  }
  metrics.init(app, options)

  const resetStubs = () => {
    createMiddlewareStub.restore()
  }
  return {
    app,
    prometheusStub,
    appUseStub,
    createMiddlewareStub,
    resetStubs
  }
}

test('When initialising metrics', t => {
  const {
    app,
    appUseStub,
    createMiddlewareStub,
    resetStubs
  } = initMetrics()

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
  } = initMetrics('/custom-metrics', ['ms', 'nanos'])

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

test('When requesting the metrics client', t => {
  const {
    prometheusStub,
    resetStubs
  } = initMetrics()

  const prometheusClient = metrics.getClient()

  t.equal(prometheusClient, prometheusStub, 'it should return the client')

  resetStubs()
  t.end()
})
