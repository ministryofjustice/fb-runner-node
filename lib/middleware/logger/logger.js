const bunyan = require('bunyan')
const uuid = require('uuid')
const shorthash = require('shorthash')

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

  bunyanLogger = bunyan.createLogger(bunyanOptions)

  return (req, res, next) => {
    const requestId = uuid.v4()
    const loggerDetails = {
      request_id: requestId,
      req
    }

    if (req.headers && req.headers.cookie) {
      const cookiePieces = req.headers.cookie.split('; ')
      cookiePieces.forEach(cookie => {
        const [name, value] = cookie.split('=')
        const propName = name.replace(/([A-Z])/g, (m, m1) => `_${m1.toLowerCase()}`)
        loggerDetails[propName] = shorthash.unique(value)
      })
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
