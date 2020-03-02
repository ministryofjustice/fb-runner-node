const {
  test
} = require('tap')

const { init } = require('./keep-alive')

test('When kee-alive is required ', t => {
  t.equal(typeof init, 'function', 'it should export the init method')

  t.end()
})
