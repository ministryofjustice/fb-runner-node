const test = require('tape')

const validateInput = require('./validate-input')

test('When validateInput is required ', t => {
  t.equal(typeof validateInput, 'function', 'it should export a function')
  t.end()
})
