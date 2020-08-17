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
  getEnvStub.returns({
    SERVICE_SLUG: 'slug',
    SERVICE_SECRET: 'secret',
    USER_DATASTORE_URL: 'some-url.com',
    SUBMITTER_URL: 'other-url.com',
    SUBMISSION_ENCRYPTION_KEY: 'awesome-encryption-key'
  })

  const constants = proxyquire('./constants', {
    './get-env': getEnvStub
  })

  t.deepEqual(constants, {
    PORT: 3000,
    SERVICE_SECRET: 'secret',
    RUNNER_DIR: runnerDir,
    APP_DIR: runnerDir,
    UPLOADS_DIR: '/tmp/uploads',
    ROUTES: {
      ping: '/ping.json',
      healthcheck: '/healthcheck.json',
      keepAlive: '/keep-alive.json'
    },
    MAINTENANCE_MODE: false,
    EDITABLE: false,
    NUNJUCKSOPTIONS: {
      noCache: true,
      watch: false
    },
    ASSET_PATH: 'public',
    ASSET_SRC_PATH: '/assets',
    RUNNER_URL: 'http://slug.formbuilder-services-undefined-undefined:3000',
    EXCLUDE_FROM_SEARCH_RESULTS: false,
    SERVICE_SLUG: 'slug',
    USER_DATASTORE_URL: 'some-url.com',
    SAVE_RETURN_URL: 'some-url.com',
    EMAIL_URL: 'other-url.com',
    SMS_URL: 'other-url.com',
    SUBMITTER_URL: 'other-url.com',
    SUBMISSION_ENCRYPTION_KEY: 'awesome-encryption-key'
  }, 'it should set the correct values')

  t.end()
})

test('Overriding the callback URL', t => {
  getEnvStub.returns({
    RUNNER_OVERRIDE_URL: 'some-url.com',
    SERVICE_SLUG: 'slug',
    SERVICE_SECRET: 'secret',
    USER_DATASTORE_URL: 'some-url.com',
    SUBMITTER_URL: 'other-url.com',
    SUBMISSION_ENCRYPTION_KEY: 'awesome-encryption-key'
  })

  const constants = proxyquire('./constants', {
    './get-env': getEnvStub
  })

  t.deepEqual(constants.RUNNER_URL, 'some-url.com', 'it should override the Runner callback URL')

  t.end()
})
