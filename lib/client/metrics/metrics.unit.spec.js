const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')

const getClientStub = stub()

getClientStub.returns({
  Histogram: class HistogramTestClass {
    constructor (options) {
      return options
    }
  }
})

const metrics = proxyquire('./metrics', {
  '../../middleware/metrics/metrics': {
    getClient: getClientStub
  }
})

test('When the metrics client is requested', t => {
  const {apiMetrics, requestMetrics} = metrics.getMetricsClient()

  const baseValues = {
    labelNames: ['client_name', 'base_url', 'url', 'method', 'status_code', 'status_message', 'error_name'],
    buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10]
  }

  t.deepEqual(apiMetrics, Object.assign({
    name: 'jwt_api_requests',
    help: 'API calls using FB JWT Client'
  }, baseValues), 'it should return the instantiated apiMetrics object')
  t.deepEqual(requestMetrics, Object.assign({
    name: 'jwt_client_requests',
    help: 'HTTP requests using FB JWT Client'
  }, baseValues), 'it should return the instantiated requestMetrics object')

  t.end()
})
