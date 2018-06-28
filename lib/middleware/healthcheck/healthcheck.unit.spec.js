const test = require('tape')

const healthcheck = require('./healthcheck')

test('When healthcheck is required ', t => {
  t.equal(typeof healthcheck.init, 'function', 'it should export the init method')

  t.end()
})
