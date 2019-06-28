const metrics = require('../../middleware/metrics/metrics')

let metricsClient

const init = () => {
  if (metricsClient) {
    return
  }
  const prometheusClient = metrics.getClient()

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

  metricsClient = {
    apiMetrics,
    requestMetrics
  }
}

const getMetricsClient = () => {
  init()
  return metricsClient
}

module.exports = {
  getMetricsClient
}
