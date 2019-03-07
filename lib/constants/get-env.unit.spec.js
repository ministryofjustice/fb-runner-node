const test = require('tape')

const getEnv = require('./get-env')

test('When getEnv is called', t => {
  t.deepEqual(process.env, getEnv(), 'it should return process.env')
  t.end()
})
