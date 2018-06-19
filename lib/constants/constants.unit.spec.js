const test = require('tape')

process.env = {}

const constants = require('../constants')

test('When constants is called', t => {
  t.deepEqual(constants, {
    PORT: 3000,
    SITEDATAPATH: 'lib/spec/servicedata/metadata',
    ROUTES: {
      ping: '/ping.json',
      healthcheck: '/healthcheck.json'
    },
    ASSET_PATH: 'public',
    ASSET_SRC_PATH: '/assets'
  }, 'it should set the correct values')
  t.end()
})
