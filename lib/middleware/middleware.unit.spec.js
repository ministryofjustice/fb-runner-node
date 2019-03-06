const test = require('tape')

const {
  auth,
  ping,
  healthcheck,
  robots,
  referrer,
  csrf,
  nunjucksConfiguration,
  locals,
  userData,
  routesStatic,
  routesCached,
  routesMetadata,
  routesNunjucks,
  errorHandler
} = require('./middleware')

test('When the module is loaded', function (t) {
  t.notEqual(typeof auth, 'undefined', 'it should export the auth middleware')
  t.notEqual(typeof ping, 'undefined', 'it should export the ping middleware')
  t.notEqual(typeof healthcheck, 'undefined', 'it should export the healthcheck middleware')
  t.notEqual(typeof robots, 'undefined', 'it should export the robots middleware')
  t.notEqual(typeof referrer, 'undefined', 'it should export the referrer middleware')
  t.notEqual(typeof csrf, 'undefined', 'it should export the csrf middleware')
  t.notEqual(typeof nunjucksConfiguration, 'undefined', 'it should export the nunjucksConfiguration middleware')
  t.notEqual(typeof locals, 'undefined', 'it should export the locals middleware')
  t.notEqual(typeof userData, 'undefined', 'it should export the userData load middleware')
  t.notEqual(typeof routesStatic, 'undefined', 'it should export the routesStatic middleware')
  t.notEqual(typeof routesCached, 'undefined', 'it should export the routesCached middleware')
  t.notEqual(typeof routesMetadata, 'undefined', 'it should export the routesMetadata middleware')
  t.notEqual(typeof routesNunjucks, 'undefined', 'it should export the routesNunjucks middleware')
  t.notEqual(typeof errorHandler, 'undefined', 'it should export the errorHandler middleware')

  t.end()
})
