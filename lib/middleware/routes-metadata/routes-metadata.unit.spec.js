const test = require('tape')

const routesMetadata = require('./routes-metadata')

test('When healthcheck is required ', t => {
  t.equal(typeof routesMetadata.init, 'function', 'it should export the init method')

  t.end()
})
