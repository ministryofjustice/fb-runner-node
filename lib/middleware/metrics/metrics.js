const promster = require('@promster/express')
const routeMetrics = require('./route-metrics')

let prometheusClient

/**
 * Initialise metrics
 *
 * @param {object} app
 * Express instance
 *
 * @param {object} [options]
 * Initialisation options
 *
 * @param {string} [options.endpoint]
 * Url to expose metrics on
 *
 * @param {array} [options.accuracies]
 * Accuracies to use
 *
 * @return {object} prometheusClient
 */
const init = (app, options = {}) => {
  options = Object.assign({
    endpoint: '/metrics',
    accuracies: ['ms']
  }, options)

  app.use(promster.createMiddleware({app, options}))

  prometheusClient = app.locals.Prometheus

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
