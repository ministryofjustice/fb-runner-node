const test = require('tape')

const session = require('./session')

test('When session is required ', t => {
  t.equal(typeof session.init, 'function', 'it should export the init method')

  t.end()
})
