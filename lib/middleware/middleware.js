const metrics = require('./metrics/metrics')
const logger = require('./logger/logger')
const auth = require('./auth/auth')
const ping = require('./ping/ping')
const referrer = require('./referrer/referrer')
const csrf = require('./csrf/csrf')
const healthcheck = require('./healthcheck/healthcheck')
const robots = require('./robots/robots')
const nunjucksConfiguration = require('./nunjucks-configuration/nunjucks-configuration')
const locals = require('./locals/locals')
const userSession = require('./user-session/user-session')
const userData = require('./user-data/user-data')
const routesStatic = require('./routes-static/routes-static')
const routesCached = require('./routes-cached/routes-cached')
const routesOutput = require('./routes-output/routes-output')
const routesMetadata = require('./routes-metadata/routes-metadata')
const routesNunjucks = require('./routes-nunjucks/routes-nunjucks')
const errorHandler = require('./error-handler/error-handler')

module.exports = {
  metrics,
  logger,
  auth,
  ping,
  healthcheck,
  robots,
  referrer,
  csrf,
  nunjucksConfiguration,
  locals,
  userData,
  userSession,
  routesStatic,
  routesCached,
  routesOutput,
  routesMetadata,
  routesNunjucks,
  errorHandler
}
