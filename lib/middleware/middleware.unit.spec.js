const test = require('tape')

const middleware = require('./middleware')

test('When the middleware module is loaded', function (t) {
  t.deepEqual(Object.keys(middleware).sort(), [
    'auth',
    'csrf',
    'errorHandler',
    'healthcheck',
    'locals',
    'logger',
    'metrics',
    'nunjucksConfiguration',
    'ping',
    'referrer',
    'robots',
    'routesCached',
    'routesMetadata',
    'routesNunjucks',
    'routesOutput',
    'routesStatic',
    'userData',
    'userSession'
  ],
  'it should export the expected functions')

  t.end()
})
