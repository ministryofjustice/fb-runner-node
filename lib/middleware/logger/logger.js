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
      req: serializeRequest,
      error: serializeError
    }
  }

  bunyanLogger = bunyan.createLogger(bunyanOptions)

  return getMiddleware()
}

const getMiddleware = () => {
  return (req, res, next) => {
    if (!bunyanLogger) {
      init()
    }
    const requestId = uuid.v4()
    const loggerDetails = {
      requestId,
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
  getMiddleware,
  getLogger
}
