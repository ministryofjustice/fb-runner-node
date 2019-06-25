const bunyan = require('bunyan')
const uuid = require('uuid')

const reqProps = ['httpVersion', 'headers', 'method', 'upgrade', 'url']

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
      req: (req) => {
        const reqJSON = {}
        reqProps.forEach(prop => {
          if (typeof req[prop] === 'object') {
            reqJSON[prop] = Object.assign({}, req[prop])
          } else {
            reqJSON[prop] = req[prop]
          }
        })
        if (reqJSON.headers.cookie) {
          reqJSON.headers.cookie = '[REDACTED]'
        }
        return reqJSON
      },
      error: (error) => {
        const errJSON = {
          name: error.name,
          body: error.body,
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          statusMessage: error.statusMessage,
          stack: error.stack,
          stacktrace: error.stacktrace,
          response: error.response
        }
        return errJSON
      }
    }
  }

  const bunyanLogger = bunyan.createLogger(bunyanOptions)

  return (req, res, next) => {
    const request_id = uuid.v4() // eslint-disable-line camelcase

    bunyanLogger.info({
      name: 'http_request',
      request_id,
      req
    }, `${req.method} ${req.url}`)

    req.logger = bunyanLogger.child({
      request_id,
      req
    })

    next()
  }
}

module.exports = {
  init
}
