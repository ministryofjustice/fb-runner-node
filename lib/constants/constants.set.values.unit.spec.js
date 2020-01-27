const {
  test
} = require('tape')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const fs = require('fs')

const readFileSyncStub = sinon.stub()

readFileSyncStub.callsFake((file, encoding) => {
  if (file.includes('APP_SHA')) {
    return Buffer.from('f6bac8e')
  }
  return fs.readFileSync(file, encoding)
})

const processEnv = {
  SERVICE_SHA: 'service_git_sha',
  APP_DIR: '/app_dir',
  EDITABLE: 'true',
  SERVICE_PATH: '/pathToSiteData',
  SERVICE_TOKEN: 'token-for-service',
  SERVICE_SECRET: 'secret-for-service',
  SERVICE_SLUG: 'slug-for-service',
  USER_DATASTORE_URL: 'http://fb-user-datastore-api-svc-foo-bar.formbuilder-platform-foo-bar/',
  SUBMITTER_URL: 'http://fb-submitter-api-svc-foo-bar.formbuilder-platform-foo-bar/',
  PLATFORM_ENV: 'foo',
  DEPLOYMENT_ENV: 'bar',
  FORM_URL: 'https://form.bar.test.service.justicve.gov.uk',
  PORT: 1234,
  NUNJUCKS_NOCACHE: 'false',
  NUNJUCKS_WATCH: 'true',
  GA_TRACKING_ID: 'UA-1234',
  SENTRY_DSN: 'raven-maven',
  USERNAME: 'user',
  PASSWORD: '1234',
  REALM: 'secret-garden',
  UPLOADS_DIR: '/uploads'
}

const getEnvStub = sinon.stub().returns(processEnv)

const constants = proxyquire('./constants', {
  fs: { readFileSync: readFileSyncStub },
  './get-env': getEnvStub
})

test('it returns correct RUNNER_URL', t => {
  t.equal(constants.RUNNER_URL, 'http://slug-for-service.formbuilder-services-foo-bar:1234')
  t.end()
})

test('When the APP_SHA file is present', t => {
  t.equal(constants.APP_SHA, 'f6bac8e', 'constants should set APP_SHA to that value of the file')
  t.end()
})

test('When the SERVICE_SHA ENV variable is set', t => {
  t.equal(constants.SERVICE_SHA, 'service_git_sha', 'constants should set SERVICE_SHA to that value')
  t.end()
})

test('When the APP_DIR ENV variable is set', t => {
  t.equal(constants.APP_DIR, '/app_dir', 'constants should set APP_DIR to that value')
  t.end()
})

test('When the EDITABLE ENV variable is set', t => {
  t.equal(constants.EDITABLE, true, 'constants should set EDITABLE to that value')
  t.end()
})

test('When the SERVICE_PATH ENV variable is set', t => {
  t.equal(constants.SERVICE_PATH, '/pathToSiteData', 'constants should set SERVICE_PATH to that value')
  t.end()
})

test('When the SERVICE_SLUG ENV variable is set', t => {
  t.equal(constants.SERVICE_SLUG, 'slug-for-service', 'constants should set SERVICE_SLUG to that value')
  t.end()
})

test('When the SERVICE_TOKEN ENV variable is set', t => {
  t.equal(constants.SERVICE_TOKEN, 'token-for-service', 'constants should set SERVICE_TOKEN to that value')
  t.end()
})

test('When the SERVICE_SECRET ENV variable is set', t => {
  t.equal(constants.SERVICE_SECRET, 'secret-for-service', 'constants should set SERVICE_SECRET to that value')
  t.end()
})

test('When the USER_DATASTORE_URL ENV variable is set', t => {
  t.equal(constants.USER_DATASTORE_URL, 'http://fb-user-datastore-api-svc-foo-bar.formbuilder-platform-foo-bar/', 'constants should set USER_DATASTORE_URL to that value')
  t.end()
})

test('When the USER_DATASTORE_URL ENV variable is set and no value is passed for SAVE_RETURN_URL', t => {
  t.equal(constants.SAVE_RETURN_URL, 'http://fb-user-datastore-api-svc-foo-bar.formbuilder-platform-foo-bar/', 'constants should set SAVE_RETURN_URL to that value')
  t.end()
})

test('When the SUBMITTER_URL ENV variable is set', t => {
  t.equal(constants.SUBMITTER_URL, 'http://fb-submitter-api-svc-foo-bar.formbuilder-platform-foo-bar/', 'constants should set SUBMITTER_URL to that value')

  t.equal(constants.PLATFORM_ENV, 'foo', 'constants should set the PLATFORM_ENV correctly')
  t.equal(constants.DEPLOYMENT_ENV, 'bar', 'constants should set the DEPLOYMENT_ENV correctly')
  t.equal(constants.FQD, 'https://form.bar.test.service.justicve.gov.uk', 'constants should set the FQD env correctly')
  t.end()
})

test('When the SUBMITTER_URL ENV variable is set and no value is passed for EMAIL_URL', t => {
  t.equal(constants.EMAIL_URL, 'http://fb-submitter-api-svc-foo-bar.formbuilder-platform-foo-bar/', 'constants should set EMAIL_URL to that value')
  t.end()
})

test('When the SUBMITTER_URL ENV variable is set and no value is passed for SMS_URL', t => {
  t.equal(constants.SMS_URL, 'http://fb-submitter-api-svc-foo-bar.formbuilder-platform-foo-bar/', 'constants should set SMS_URL to that value')
  t.end()
})

test('When the PORT ENV variable is set', t => {
  t.equal(constants.PORT, 1234, 'constants should set PORT to that value')
  t.end()
})

test('When the NUNJUCKS_NOCACHE ENV variable is set', t => {
  t.equal(constants.NUNJUCKSOPTIONS.noCache, false, 'constants should set NUNJUCKSOPTIONS.noCache to that value')
  t.end()
})

test('When the NUNJUCKS_WATCH ENV variable is set', t => {
  t.equal(constants.NUNJUCKSOPTIONS.watch, true, 'constants should set NUNJUCKSOPTIONS.watch to that value')
  t.end()
})

test('When the GA_TRACKING_ID ENV variable is set', t => {
  t.equal(constants.GA_TRACKING_ID, 'UA-1234', 'constants should set GA_TRACKING_ID to that value')
  t.end()
})

test('When the SENTRY_DSN ENV variable is set', t => {
  t.equal(constants.SENTRY_DSN, 'raven-maven', 'constants should set SENTRY_DSN to that value')
  t.end()
})

test('When the basic auth ENV variables are set', t => {
  t.equal(constants.USERNAME, 'user', 'constants should set USERNAME')
  t.equal(constants.PASSWORD, '1234', 'constants should set PASSWORD')
  t.equal(constants.REALM, 'secret-garden', 'constants should set REALM')
  t.end()
})

test('When the UPLOADS_DIR ENV variable is set', t => {
  t.equal(constants.UPLOADS_DIR, '/uploads', 'constants should set UPLOADS_DIR to that value')
  t.end()
})
