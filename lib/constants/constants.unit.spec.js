const test = require('tape')
const proxyquire = require('proxyquire')
const {FBTest} = require('@ministryofjustice/fb-utils-node')
const {stubModule} = FBTest()

const path = require('path')
const runnerDir = path.resolve(__dirname, '..', '..')

const getEnvStub = stubModule('getEnv', () => ({}))

process.env = {}

const constants = proxyquire('./constants', {
  './get-env': getEnvStub
})

test('When constants is called', t => {
  t.deepEqual(constants, {
    APP_DIR: runnerDir,
    RUNNER_DIR: runnerDir,
    EDITABLE: false,
    PORT: 3000,
    SERVICE_TOKEN: '<NONE>',
    SERVICE_SECRET: '<NONE>',
    COMPONENTS_MODULE: '@ministryofjustice/fb-components-core',
    COMPONENTS_VERSION: '~0.0.146-1',
    ROUTES: {
      ping: '/ping.json',
      healthcheck: '/healthcheck.json'
    },
    NUNJUCKSOPTIONS: {
      noCache: true,
      watch: false
    },
    ASSET_PATH: 'public',
    ASSET_SRC_PATH: '/assets',
    UPLOADS_DIR: '/tmp/uploads'
  }, 'it should set the correct values')
  t.end()
})
