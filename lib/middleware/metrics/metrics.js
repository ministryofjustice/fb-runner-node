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
    let summaryChunks = summary.split('\n')
    let clientDurations = [
      '\n# HELP client_request_duration_milliseconds The client request latencies in milliseconds.',
      '# TYPE client_request_duration_milliseconds histogram'
    ]
    let clientTotals = [
      '\n# HELP client_requests_total The total client requests.',
      '# TYPE client_requests_total counter'
    ]
    summaryChunks = summaryChunks.map(chunk => {
      if (chunk.includes('client="')) {
        chunk = chunk.replace(/http_/, 'client_')
        if (chunk.startsWith('client_request_duration_milliseconds')) {
          clientDurations.push(chunk)
        } else if (chunk.startsWith('client_requests_total')) {
          clientTotals.push(chunk)
        }
        return ''
      }
      if (chunk.startsWith('# HELP')) {
        chunk = `\n${chunk}`
      }
      return chunk
    }).filter(chunk => chunk)
    summaryChunks = summaryChunks.concat(clientDurations).concat(clientTotals)
    const summaryOut = summaryChunks.join('\n')
    res.end(summaryOut)
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
