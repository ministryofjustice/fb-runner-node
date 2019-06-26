const promster = require('@promster/express')

const init = (app, options = {
  endpoint: '/metrics',
  accuracies: ['ms'],
  labels: ['client_name', 'endpoint']
}) => {
  app.use(promster.createMiddleware({app, options}))

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
