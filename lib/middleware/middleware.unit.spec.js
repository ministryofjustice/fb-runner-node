const test = require('tape')

const middleware = require('./middleware')
const expected = [
  'auth',
  'csrf',
  'errorHandler',
  'healthcheck',
  'keepAlive',
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
  'routesStatic',
  'userData',
  'userSession'
]

test('When the middleware module is loaded', function (t) {
  t.deepEqual(Object.keys(middleware).sort(), expected.sort(),
    'it should export the expected functions')

  t.end()
})
