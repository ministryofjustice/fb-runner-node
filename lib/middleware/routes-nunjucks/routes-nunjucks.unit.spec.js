const test = require('tape')

const routesNunjucks = require('./routes-nunjucks')

test('When healthcheck is required ', t => {
  t.equal(typeof routesNunjucks.init, 'function', 'it should export the init method')

  t.end()
})
