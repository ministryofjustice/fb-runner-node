const promster = require('@promster/express')

const userDataStoreClient = require('../../client/user-datastore/user-datastore')
const userFileStoreClient = require('../../client/user-filestore/user-filestore')
const submitterClient = require('../../client/submitter/submitter')

const init = (app, platformEnv, options = {
  endpoint: '/metrics',
  accuracies: ['ms']
}) => {
  if (!platformEnv) {
    return
  }

  app.use(promster.createMiddleware({app, options}))

  const prometheusClient = app.locals.Prometheus

  // values for metrics
  const labelNames = ['client_name', 'base_url', 'url', 'method', 'status_code', 'status_message', 'error_name']
  const buckets = [0.1, 0.25, 0.5, 1, 2, 5, 10]

  const apiMetrics = new prometheusClient.Histogram({
    name: 'api_requests',
    help: 'API calls using FB JWT Client',
    labelNames,
    buckets
  })

  const requestMetrics = new prometheusClient.Histogram({
    name: 'jwt_client_requests',
    help: 'HTTP requests using FB JWT Client',
    labelNames,
    buckets
  })

  if (userDataStoreClient) {
    userDataStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)
  }
  userFileStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)
  submitterClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

  app.use(options.endpoint, (req, res) => {
    req.statusCode = 200
    res.setHeader('Content-Type', promster.getContentType())
    const summary = promster.getSummary()
    res.end(summary)
  })
}

/**
 * Record request
 *
 * @param {object} [options]
 * Options to use
 *
 * @param {array} [options.labels]
 * Labels to apply
 *
 * @return {function} requestRecorder
 */
const recordRequest = (options) => {
  const requestRecorder = promster.getRequestRecorder()
  if (!requestRecorder) {
    return () => {}
  }
  const start = process.hrtime()

  return () => {
    requestRecorder(start, options)
  }
}

module.exports = {
  init,
  recordRequest
}

/*
  const histogramStub = stub()
  const prometheusClient = {
    Histogram: histogramStub
  }

  const metricsClient = new FBJWTClient(serviceSecret, serviceToken, serviceSlug, microserviceUrl)
  metricsClient.setMetricsInstrumentation(prometheusClient)

  const apiMetricsArgs = histogramStub.getCall(0).args[0]
  const requestMetricsArgs = histogramStub.getCall(1).args[0]

  const labelNames = ['client_name', 'base_url', 'url', 'method', 'status_code', 'status_message', 'error_name']
  const buckets = [0.1, 0.25, 0.5, 1, 2, 5, 10]

  t.ok(histogramStub.calledTwice, 'it should have been called Histogram twice')

  t.deepEqual(apiMetricsArgs, {
    name: 'api_requests',
    help: 'API calls using FB JWT Client',
    labelNames,
    buckets
  }, 'it should set up the client api metrics histogram with the correct args')

  t.deepEqual(requestMetricsArgs, {
    name: 'jwt_client_requests',
    help: 'HTTP requests using FB JWT Client',
    labelNames,
    buckets
  }, 'it it should set up the client request metrics histogram with the correct args')
  */
