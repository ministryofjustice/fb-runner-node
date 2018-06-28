const test = require('tape')

const validateRequired = require('./validate-required')

test('When validateInput is required ', t => {
  t.equal(typeof validateRequired, 'function', 'it should export a function')
  t.end()
})
