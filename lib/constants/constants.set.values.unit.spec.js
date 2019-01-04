const test = require('tape')

process.env = {
  EDITABLE: 'true',
  SERVICE_PATH: '/pathToSiteData',
  SERVICE_TOKEN: 'token-for-service',
  SERVICE_SLUG: 'slug-for-service',
  USER_DATASTORE_URL: 'https://userdatastore.gov.uk',
  PORT: 1234,
  NUNJUCKS_NOCACHE: 'false',
  NUNJUCKS_WATCH: 'true',
  GA_TRACKING_ID: 'UA-1234',
  SENTRY_DSN: 'raven-maven',
  USERNAME: 'user',
  PASSWORD: '1234',
  REALM: 'secret-garden'
}

const constants = require('./constants')

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

test('When the USER_DATASTORE_URL ENV variable is set', t => {
  t.equal(constants.USER_DATASTORE_URL, 'https://userdatastore.gov.uk', 'constants should set USER_DATASTORE_URL to that value')
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
