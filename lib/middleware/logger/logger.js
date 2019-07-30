const bunyan = require('bunyan')
const uuid = require('uuid')
const {
  serializeRequest,
  serializeError
} = require('../serializers/serializers')

let bunyanLogger

const init = (options = {}) => {
  const {
    LOG_LEVEL,
    PLATFORM_ENV,
    DEPLOYMENT_ENV,
    SERVICE_SLUG
  } = options

  let logLevel = LOG_LEVEL
  if (!logLevel) {
    logLevel = PLATFORM_ENV ? 'info' : 'error'
  }

  const bunyanOptions = {
    name: 'fb-runner-logger',
    application: 'fb-runner',
    PLATFORM_ENV,
    DEPLOYMENT_ENV,
    SERVICE_SLUG,
    level: logLevel,
    serializers: {
      req: (req) => serializeRequest(req),
      error: (error) => serializeError(error)
    }
  }

  bunyanLogger = bunyan.createLogger(bunyanOptions)

  return (req, res, next) => {
    const loggerDetails = {
      requestId: uuid.v4(),
      req
    }

    bunyanLogger.info(Object.assign({
      name: 'http_request'
    }, loggerDetails), `${req.method} ${req.url}`)

    req.logger = bunyanLogger.child(loggerDetails)

    next()
  }
}

const getLogger = () => {
  return bunyanLogger
}

module.exports = {
  init,
  getLogger
}
