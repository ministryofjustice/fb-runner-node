require('@ministryofjustice/module-alias/register-module')(module)

const {
  test
} = require('tap')
const proxyquire = require('proxyquire')
const { invokeUrl } = require('~/fb-runner-node/spec/mock-express-middleware')

const constants = {
  APP_SHA: 'APP_SHA',
  SERVICE_SHA: 'SERVICE_SHA'
}

const ping = proxyquire('./ping', {
  '~/fb-runner-node/constants/constants': constants
})

const payload = {
  APP_SHA: constants.APP_SHA,
  SERVICE_SHA: constants.SERVICE_SHA
}

const defaultPing = ping.init()

test('When ping is required ', t => {
  t.equal(typeof ping.init, 'function', 'it should export the init method')

  t.end()
})

test('When using default ping configuration and a user agent requests ping.json', t => {
  const { assertStatusCode, assertJSON } = invokeUrl(defaultPing, t, '/ping.json')

  assertStatusCode(200)
  assertJSON(payload)

  t.end()
})
