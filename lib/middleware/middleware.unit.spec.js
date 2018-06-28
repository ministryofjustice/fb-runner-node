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
  t.notEqual(typeof auth, 'undefined', 'it should export the auth middleware')
  t.notEqual(typeof ping, 'undefined', 'it should export the ping middleware')
  t.notEqual(typeof healthcheck, 'undefined', 'it should export the healthcheck middleware')
  t.notEqual(typeof robots, 'undefined', 'it should export the robots middleware')
  t.notEqual(typeof locals, 'undefined', 'it should export the locals middleware')
  t.notEqual(typeof userData, 'undefined', 'it should export the userData load middleware')
  t.notEqual(typeof routesStatic, 'undefined', 'it should export the routesStatic middleware')
  t.notEqual(typeof routesCached, 'undefined', 'it should export the routesCached middleware')
  t.notEqual(typeof routesMetadata, 'undefined', 'it should export the routesMetadata middleware')
  t.notEqual(typeof routesNunjucks, 'undefined', 'it should export the routesNunjucks middleware')
  t.notEqual(typeof errorHandler, 'undefined', 'it should export the errorHandler middleware')

  t.end()
})

/*

  t.equal(typeof auth.init, 'function', 'it should export the auth middleware')
  t.equal(typeof ping.init, 'function', 'it should export the ping middleware')
  t.equal(typeof healthcheck.init, 'function', 'it should export the healthcheck middleware')
  t.equal(typeof robots.init, 'function', 'it should export the robots middleware')
  t.equal(typeof locals.init, 'function', 'it should export the locals middleware')
  t.equal(typeof userData.load, 'function', 'it should export the userData load middleware')
  t.equal(typeof userData.save, 'function', 'it should export the userData save middleware')
  t.equal(typeof routesStatic.init, 'function', 'it should export the routesStatic middleware')
  t.equal(typeof routesCached.init, 'function', 'it should export the routesCached middleware')
  t.equal(typeof routesMetadata.init, 'function', 'it should export the routesMetadata middleware')
  t.equal(typeof routesNunjucks.init, 'function', 'it should export the routesNunjucks middleware')
  t.equal(typeof errorHandler, 'function', 'it should export the errorHandler middleware')
  */
