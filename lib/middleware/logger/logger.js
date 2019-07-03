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

  const pickProperties = (obj, props) => {
    const picked = {}
    props.forEach(prop => {
      if (obj[prop] !== undefined) {
        picked[prop] = obj[prop]
      }
    })
    return picked
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
        const reqCopy = Object.assign({}, req)
        reqCopy.headers = Object.assign({}, reqCopy.headers)
        if (reqCopy.headers.cookie) {
          reqCopy.headers.cookie = '[REDACTED]'
        }

        const props = [
          'method',
          'url',
          'headers',
          'httpVersion',
          'upgrade'
        ]

        return pickProperties(reqCopy, props)
      },
      error: (error) => {
        const errorCopy = Object.assign({}, error)
        if (errorCopy.response) {
          const responseProps = [
            'statusCode',
            'statusMessage',
            'body',
            'headers',
            'timings'
          ]
          errorCopy.response = pickProperties(errorCopy.response, responseProps)
        }

        const props = [
          'name',
          'code',
          'message',
          'columnNumber',
          'fileName',
          'lineNumber',
          'stack',
          'statusCode',
          'statusMessage',
          'body',
          'client_headers',
          'response'
        ]

        return pickProperties(errorCopy, props)
      }
    }
  }

  bunyanLogger = bunyan.createLogger(bunyanOptions)

  return (req, res, next) => {
    const requestId = uuid.v4()
    const loggerDetails = {
      requestId,
      req
    }

    if (req.headers && req.headers.cookie) {
      const cookiePieces = req.headers.cookie.split('; ')
      cookiePieces.forEach(cookie => {
        const [name, value] = cookie.split('=')
        loggerDetails[name] = shorthash.unique(value)
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
