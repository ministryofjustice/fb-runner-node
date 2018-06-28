const auth = require('./auth/auth')
const ping = require('./ping/ping')
const healthcheck = require('./healthcheck/healthcheck')
const robots = require('./robots/robots')
const nunjucksConfiguration = require('./nunjucks-configuration/nunjucks-configuration')
const locals = require('./locals/locals')
const userData = require('./user-data/user-data')
const routesStatic = require('./routes-static/routes-static')
const routesCached = require('./routes-cached/routes-cached')
const routesMetadata = require('./routes-metadata/routes-metadata')
const routesNunjucks = require('./routes-nunjucks/routes-nunjucks')
const errorHandler = require('./error-handler/error-handler')

module.exports = {
  auth,
  ping,
  healthcheck,
  robots,
  nunjucksConfiguration,
  locals,
  userData,
  routesStatic,
  routesCached,
  routesMetadata,
  routesNunjucks,
  errorHandler
}
