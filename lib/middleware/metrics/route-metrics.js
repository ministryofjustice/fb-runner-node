const promster = require('@promster/express')

const metricsRoute = (req, res) => {
  if (req.get('x-forwarded-host')) {
    throw new Error(403)
  }
  const contentType = promster.getContentType()
  res.setHeader('Content-Type', contentType)
  const summary = promster.getSummary()
  res.end(summary)
}

module.exports = metricsRoute
