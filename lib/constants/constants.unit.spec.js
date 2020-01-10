const {
  test
} = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const path = require('path')
const runnerDir = path.resolve(__dirname, '..', '..')

const getEnvStub = sinon.stub()

process.env = {}

test('When constants is called', t => {
  getEnvStub.returns({})

  const constants = proxyquire('./constants', {
    './get-env': getEnvStub
  })

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

test('Overriding the callback URL', t => {
  getEnvStub.returns({
    RUNNER_OVERRIDE_URL: 'some-url.com'
  })

  const constants = proxyquire('./constants', {
    './get-env': getEnvStub
  })

  t.deepEqual(constants.RUNNER_URL, 'some-url.com', 'it should override the Runner callback URL')

  t.end()
})
