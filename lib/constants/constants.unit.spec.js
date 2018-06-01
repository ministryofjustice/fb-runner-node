const test = require('tape')

process.env = {}

const constants = require('../constants')

test('When constants is called', t => {
  t.deepEquals(constants, {
    PORT: 3000,
    ROUTES: {
      ping: '/ping.json',
      healthcheck: '/healthcheck.json'
    },
    ASSET_PATH: 'public',
    ASSET_SRC_PATH: '/public'
  }, 'it should set the correct values')
  t.end()
})
