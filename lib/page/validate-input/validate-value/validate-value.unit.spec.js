const test = require('tape')

const validateValue = require('./validate-value')

test('When validateInput is required ', t => {
  t.equal(typeof validateValue, 'function', 'it should export a function')
  t.end()
})
