const test = require('tape')

const { init } = require('./healthcheck')

test('When healthcheck is required ', t => {
  t.equal(typeof init, 'function', 'it should export the init method')

  t.end()
})
