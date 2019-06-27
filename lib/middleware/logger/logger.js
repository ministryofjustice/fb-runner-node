const bunyan = require('bunyan')
const uuid = require('uuid')
const shorthash = require('shorthash')

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
        const headers = Object.assign({}, req.headers)
        if (headers.cookie) {
          headers.cookie = '[REDACTED]'
        }
        const reqJSON = {
          method: req.method,
          url: req.url,
          headers,
          http_version: req.httpVersion,
          upgrade: req.upgrade
        }
        return reqJSON
      },
      error: (error) => {
        let responseJSON
        const {response} = error
        if (response) {
          responseJSON = {
            status_code: response.statusCode,
            status_message: response.statusMessage,
            body: response.body,
            headers: response.headers,
            timings: response.timings
          }
        }
        const errJSON = {
          name: error.name,
          code: error.code,
          message: error.message,
          column_number: error.columnNumber,
          file_name: error.fileName,
          line_number: error.lineNumber,
          stack: error.stack,
          status_code: error.statusCode,
          status_message: error.statusMessage,
          body: error.body,
          client_headers: error.client_headers,
          response: responseJSON
        }
        return errJSON
      }
    }
  }

  const bunyanLogger = bunyan.createLogger(bunyanOptions)

  return (req, res, next) => {
    const requestId = uuid.v4()
    const loggerDetails = {
      request_id: requestId,
      req
    }

    if (req.headers && req.headers.cookie) {
      loggerDetails.user = shorthash.unique(req.headers.cookie)
    }

    bunyanLogger.info(Object.assign({
      name: 'http_request'
    }, loggerDetails), `${req.method} ${req.url}`)

    req.logger = bunyanLogger.child(loggerDetails)

    next()
  }
}

module.exports = {
  init
}
