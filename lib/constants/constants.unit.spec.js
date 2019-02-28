const test = require('tape')

process.env = {}

const constants = require('./constants')

test('When constants is called', t => {
  t.deepEqual(constants, {
    EDITABLE: false,
    PORT: 3000,
    SERVICE_PATH: 'lib/spec/servicedata',
    SERVICE_TOKEN: '<NONE>',
    SERVICE_SECRET: '<NONE>',
    ROUTES: {
      ping: '/ping.json',
      healthcheck: '/healthcheck.json'
    },
    NUNJUCKSOPTIONS: {
      noCache: true,
      watch: false
    },
    ASSET_PATH: 'public',
    ASSET_SRC_PATH: '/assets'
  }, 'it should set the correct values')
  t.end()
})
