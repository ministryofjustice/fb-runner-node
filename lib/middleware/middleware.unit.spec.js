const test = require('tape')

const {
  auth,
  ping,
  healthcheck,
  robots,
  locals,
  userData,
  routesStatic,
  routesCached,
  routesMetadata,
  routesNunjucks,
  errorHandler
} = require('./middleware')

test('When the module is loaded', function (t) {
  t.equal(typeof auth.init, 'function', 'it should export the auth middleware')
  t.equal(typeof ping.init, 'function', 'it should export the ping middleware')
  t.equal(typeof healthcheck.init, 'function', 'it should export the healthcheck middleware')
  t.equal(typeof robots.init, 'function', 'it should export the robots middleware')
  t.equal(typeof locals.init, 'function', 'it should export the locals middleware')
  t.equal(typeof userData.load, 'function', 'it should export the userData middleware')
  t.equal(typeof routesStatic.init, 'function', 'it should export the routesStatic middleware')
  t.equal(typeof routesCached.init, 'function', 'it should export the routesCached middleware')
  t.equal(typeof routesMetadata.init, 'function', 'it should export the routesMetadata middleware')
  t.equal(typeof routesNunjucks.init, 'function', 'it should export the routesNunjucks middleware')
  t.equal(typeof errorHandler, 'function', 'it should export the errorHandler middleware')

  t.end()
})
