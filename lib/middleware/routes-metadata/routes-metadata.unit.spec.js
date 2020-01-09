const test = require('tape')

const {
  init
} = require('./routes-metadata')

test('When healthcheck is required ', (t) => {
  t.equal(typeof init, 'function', 'it should export the init method')

  t.end()
})
