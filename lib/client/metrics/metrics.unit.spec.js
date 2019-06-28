const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')

const middlewareMetrics = require('../../middleware/metrics/metrics')

const metrics = proxyquire('./metrics', {
  '../../middleware/metrics/metrics': middlewareMetrics
})

const initMetrics = () => {
  const histogramStub = stub()
  // histogramStub.callsFake((options) => {
  //   return options.name
  // })
  const prometheusStub = {
    Histogram: histogramStub
  }
  const getClientStub = stub(middlewareMetrics, 'getClient')
  getClientStub.callsFake(() => prometheusStub)

  const resetStubs = () => {
    // histogramStub.reset()
    getClientStub.restore()
  }

  metrics.init()
  return {
    histogramStub,
    prometheusStub,
    getClientStub,
    resetStubs
  }
}

test('When the client metrics is initialised', t => {
  const {
    histogramStub,
    resetStubs
  } = initMetrics()

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

  resetStubs()
  t.end()
})

test('When the metrics client is requested', t => {
  const {
    resetStubs
  } = initMetrics()

  const metricsClient = metrics.getMetricsClient()

  t.deepEqual(metricsClient.apiMetrics.constructor.name, 'functionStub', 'it should return the apiMetrics instance')
  t.deepEqual(metricsClient.requestMetrics.constructor.name, 'functionStub', 'it should return the apiMetrics instance')

  // t.deepEqual(metricsClient, {
  //   apiMetrics: 'jwt_api_requests',
  //   requestMetrics: 'jwt_client_requests'
  // }, 'it should return the correct metrics instances')

  resetStubs()
  t.end()
})
