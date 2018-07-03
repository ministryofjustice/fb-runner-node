const test = require('tape')

process.env = {
  EDITABLE: 'true',
  SERVICEDATA: '/pathToSiteData',
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

test('When the SERVICEDATA ENV variable is set', t => {
  t.equal(constants.SERVICEDATA, '/pathToSiteData', 'constants should set SERVICEDATA to that value')
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
