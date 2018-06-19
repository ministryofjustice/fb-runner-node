const test = require('tape')

process.env = {
  PORT: 1234
}

const constants = require('../constants')

test('When the PORT ENV variable is set', t => {
  t.equal(constants.PORT, 1234, 'constants should set port to that value')
  t.end()
})
