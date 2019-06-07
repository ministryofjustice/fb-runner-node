const test = require('tape')
const proxyquire = require('proxyquire')
const {FBTest} = require('@ministryofjustice/fb-utils-node')
const {stubModule} = FBTest()

const getEnvStub = stubModule('getEnv', () => ({}))

process.env = {}

const constants = proxyquire('./constants', {
  './get-env': getEnvStub
})

test('When constants is called', t => {
  t.deepEqual(constants, {
    EDITABLE: false,
    PORT: 3000,
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
