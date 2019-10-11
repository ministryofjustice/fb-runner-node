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
    PORT: 3000,
    SERVICE_TOKEN: '<NONE>',
    SERVICE_SECRET: '<NONE>',
    RUNNER_DIR: runnerDir,
    APP_DIR: runnerDir,
    UPLOADS_DIR: '/tmp/uploads',
    ROUTES: {
      ping: '/ping.json',
      healthcheck: '/healthcheck.json'
    },
    EDITABLE: false,
    NUNJUCKSOPTIONS: {
      noCache: true,
      watch: false
    },
    ASSET_PATH: 'public',
    ASSET_SRC_PATH: '/assets',
    RUNNER_URL: 'http://undefined.formbuilder-services-undefined-undefined:3000'
  }, 'it should set the correct values')
  t.end()
})
