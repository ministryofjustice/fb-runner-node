const Sentry = require('@sentry/node')

const metrics = require('../middleware/metrics/metrics')
const logger = require('../middleware/logger/logger')
const {serializeRequest} = require('../middleware/serializers/serializers')

const configureMonitoring = (app, options = {}) => {
  const {
    PLATFORM_ENV,
    DEPLOYMENT_ENV,
    LOG_LEVEL,
    SENTRY_DSN,
    SERVICE_SLUG,
    APP_VERSION
  } = options

  // Configure Sentry to handle exceptions
  if (SENTRY_DSN) {
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: `${PLATFORM_ENV} / ${DEPLOYMENT_ENV}`,
      release: APP_VERSION,
      beforeSend: (event) => {
        if (event.request) {
          event.request = serializeRequest(event.request)
        }
        return event
      }
    })

    Sentry.configureScope(scope => {
      scope.setExtra('PLATFORM_ENV', PLATFORM_ENV)
      scope.setExtra('DEPLOYMENT_ENV', DEPLOYMENT_ENV)
      scope.setExtra('SERVICE_SLUG', SERVICE_SLUG)
    })
  }

  // Configure prometheus to handle metrics
  // metrics client is available as metrics.getClient
  metrics.init(app, {
    defaultLabels: {
      PLATFORM_ENV: PLATFORM_ENV,
      DEPLOYMENT_ENV: DEPLOYMENT_ENV,
      SERVICE_SLUG: SERVICE_SLUG
    }
  })

  // Configure bunyan for logging request immediately
  // application-level logger is available as logger.getLogger
  // per-request child logger is available as req.logger
  logger.init({
    LOG_LEVEL: LOG_LEVEL,
    PLATFORM_ENV: PLATFORM_ENV,
    DEPLOYMENT_ENV: DEPLOYMENT_ENV,
    SERVICE_SLUG: SERVICE_SLUG
  })
}

module.exports = configureMonitoring
