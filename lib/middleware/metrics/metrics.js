const promster = require('@promster/express')
const routeMetrics = require('./route-metrics')

const userDataStoreClient = require('../../client/user-datastore/user-datastore')
const userFileStoreClient = require('../../client/user-filestore/user-filestore')
const submitterClient = require('../../client/submitter/submitter')

let prometheusClient

const init = (app, platformEnv, options = {}) => {
  if (!platformEnv) {
    return
  }

  options = Object.assign({
    endpoint: '/metrics',
    accuracies: ['ms']
  }, options)

  app.use(promster.createMiddleware({app, options}))

  prometheusClient = app.locals.Prometheus

  // values for metrics
  const labelNames = ['client_name', 'base_url', 'url', 'method', 'status_code', 'status_message', 'error_name']
  const buckets = [0.1, 0.25, 0.5, 1, 2, 5, 10]

  const apiMetrics = new prometheusClient.Histogram({
    name: 'jwt_api_requests',
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

  userDataStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)
  userFileStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)
  submitterClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

  app.use(options.endpoint, routeMetrics)
}

/**
 * Get Prometheus client
 *
 * @return {object} prometheusClient
 */
const getClient = () => {
  return prometheusClient
}

module.exports = {
  init,
  getClient
}
