const promster = require('@promster/express')
const routeMetrics = require('./route-metrics')

// Create noop version of Prometheus client
const inc = () => {}
const dec = inc
const observe = inc
const endTimer = inc
const observeValues = () => {
  return {
    observe,
    startTimer: () => endTimer
  }
}
let prometheusClient = {
  Counter: function () {
    return {
      inc
    }
  },
  Gauge: function () {
    return {
      inc,
      dec
    }
  },
  Histogram: function () {
    return observeValues()
  },
  Summary: function () {
    return observeValues()
  }
}

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
 * @param {object} [options.defaultLabels]
 * Default labels to apply to all metrics
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

  if (options.defaultLabels) {
    prometheusClient.register.setDefaultLabels(options.defaultLabels)
  }

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
