const test = require('tape')
const proxyquire = require('proxyquire')
const {invokeUrl} = require('../../spec/mock-express-middleware')

const constants = {
  APP_SHA: 'APP_SHA',
  SERVICE_SHA: 'SERVICE_SHA',
  COMPONENTS_MODULE: 'COMPONENTS_MODULE',
  COMPONENTS_VERSION: 'COMPONENTS_VERSION'
}

const ping = proxyquire('./ping', {
  '../../constants/constants': constants
})

const pingPayload = {
  APP_SHA: constants.APP_SHA,
  SERVICE_SHA: constants.SERVICE_SHA,
  COMPONENTS_MODULE: constants.COMPONENTS_MODULE,
  COMPONENTS_VERSION: constants.COMPONENTS_VERSION
}

const defaultPing = ping.init()

test('When ping is required ', t => {
  t.equal(typeof ping.init, 'function', 'it should export the init method')

  t.end()
})

test('When using default ping configuration and a user agent requests ping.json', t => {
  t.plan(3)

  const {assertNextCalled, assertStatusCode, assertJSON} = invokeUrl(defaultPing, t, '/ping.json')

  assertNextCalled(false)
  assertStatusCode(200)
  assertJSON(pingPayload)
})

test('When using default ping configuration and a user agent requests any other resource', t => {
  t.plan(2)

  const {assertNextCalled, assertStatusCode} = invokeUrl(defaultPing, t, '/foo')

  assertNextCalled(true)
  assertStatusCode(200)
})

const customPing = ping.init({url: '/ping.alt'})

test('When using custom ping configuration and a user agent requests the ping file', t => {
  t.plan(3)

  const {assertNextCalled, assertStatusCode, assertJSON} = invokeUrl(customPing, t, '/ping.alt')

  assertNextCalled(false)
  assertStatusCode(200)
  assertJSON(pingPayload)
})

const explicitPing = ping.ping

test('When using explicit ping configuration and a user agent requests the ping file', t => {
  t.plan(3)

  const {assertNextCalled, assertStatusCode, assertJSON} = invokeUrl(explicitPing, t)

  assertNextCalled(false)
  assertStatusCode(200)
  assertJSON(pingPayload)
})
