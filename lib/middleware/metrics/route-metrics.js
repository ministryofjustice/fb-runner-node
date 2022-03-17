const promster = require('@promster/express')

const metricsRoute = (req, res) => {
  if (req.get('x-forwarded-host')) {
    throw new Error(403)
  }

  res.setHeader('Content-Type', promster.getContentType())

  promster.getSummary().then(result => {
    res.end(result)
  })
}

module.exports = metricsRoute
