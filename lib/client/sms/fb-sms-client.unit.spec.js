const test = require('tape')
const {stub, useFakeTimers} = require('sinon')

const jwt = require('jsonwebtoken')

const FBSMSClient = require('./fb-sms-client')

/* test values */
const userId = 'testUserId'
const serviceSlug = 'testServiceSlug'
const serviceToken = 'testServiceToken'
const serviceSecret = 'testServiceSecret'
const smsUrl = 'https://sms'
const createEndpointUrl = `${smsUrl}/service/${serviceSlug}/user/${userId}`
const setEndpointUrl = createEndpointUrl
const message = {foo: 'bar'}

// Ensure that client is properly instantiated

/**
 * Convenience function for testing client instantiation
 *
 * @param {object} t
 *  Object containing tape methods
 *
 * @param {array} params
 *  Arguments to pass to client constructor
 *
 * @param {string} expectedCode
 *  Error code expected to be returned by client
 *
 * @param {string} expectedMessage
 *  Error message expected to be returned by client
 *
 * @return {undefined}
 *
 **/
const testInstantiation = (t, params, expectedCode, expectedMessage) => {
  let failedClient
  try {
    t.throws(failedClient = new FBSMSClient(...params))
  } catch (e) {
    t.equal(e.name, 'FBSMSClientError', 'it should return an error of the correct type')
    t.equal(e.code, expectedCode, 'it should return the correct error code')
    t.equal(e.message, expectedMessage, 'it should return the correct error message')
  }
  t.equal(failedClient, undefined, 'it should not return an instantiated client')
  t.end()
}

test('When instantiating sms client without a service token', t => {
  testInstantiation(t, [serviceSecret], 'ENOSERVICETOKEN', 'No service token passed to client')
})

test('When instantiating sms client without a service slug', t => {
  testInstantiation(t, [serviceSecret, serviceToken], 'ENOSERVICESLUG', 'No service slug passed to client')
})

test('When instantiating sms client without a sms url', t => {
  testInstantiation(t, [serviceSecret, serviceToken, serviceSlug], 'ENOMICROSERVICEURL', 'No microservice url passed to client')
})

test('When instantiating sms client without a service secret', t => {
  testInstantiation(t, [undefined, serviceToken, serviceSlug, smsUrl], 'ENOSERVICESECRET', 'No service secret passed to client')
})

// Set up a client to test the methods
const smsClient = new FBSMSClient(serviceSecret, serviceToken, serviceSlug, smsUrl)

// Error class
test('When throwing errors', t => {
  t.equal(smsClient.ErrorClass.name, 'FBSMSClientError', 'it should use the client\'s error class')

  t.end()
})

// Endpoint URLs
test('When asking for endpoint urls', t => {
  const getUrl =
  smsClient.createEndpointUrl('/service/:serviceSlug/user/:userId', {serviceSlug, userId})
  t.equal(getUrl, createEndpointUrl, 'it should return the correct value for the get endpoint')
  const setUrl =
  smsClient.createEndpointUrl('/service/:serviceSlug/user/:userId', {serviceSlug, userId})
  t.equal(setUrl, setEndpointUrl, 'it should return the correct value for the set endpoint')

  t.end()
})

// JWT
test('When generating json web token', async t => {
  const clock = useFakeTimers({
    now: 1483228800000
  })
  const accessToken = smsClient.generateAccessToken({payload: 'testPayload'})
  const decodedAccessToken = jwt.verify(accessToken, serviceToken)
  t.equal(decodedAccessToken.checksum, 'e236cbfa627a1790355fca6aa1afbf322dad7ec025dad844b4778923a5659f06', 'it should output a token containing a checksum of the data')
  t.equal(decodedAccessToken.iat, 1483228800, 'it should output a token containing the iat property')

  clock.restore()
  t.end()
})

// Sending SMS
test('When sending a message', async t => {
  const sendPostStub = stub(smsClient, 'sendPost')
  sendPostStub.callsFake(options => {
    return Promise.resolve({
      body: ''
    })
  })

  const logger = {error: () => {}}
  const responseBody = await smsClient.sendMessage(message, {sendOptionX: 'x'}, logger)

  const callArgs = sendPostStub.getCall(0).args
  t.equal(callArgs[0].url, '/sms', 'it should pass the correct url pattern')
  t.deepEqual(callArgs[0].sendOptions, {sendOptionX: 'x'}, 'it should pass any send options through')
  t.deepEqual(callArgs[0].payload, {message, service_slug: 'testServiceSlug'}, 'it should pass the correct encrypted payload')
  t.deepEqual(callArgs[1], logger, 'it should pass any logger instance to the send method')

  t.deepEqual(responseBody, {body: ''}, 'it should return no content')

  sendPostStub.restore()
  t.end()
})

test('When sending a message results in an error', async t => {
  const logger = {error: () => {}}
  const sendPostStub = stub(smsClient, 'sendPost')
  sendPostStub.callsFake(options => {
    return Promise.reject(new Error('boom'))
  })

  try {
    t.throw(await smsClient.sendMessage({}, {logger}))
  } catch (e) {
    t.deepEqual(e.name, 'Error', 'it should return the correct error type')
    t.deepEqual(e.message, 'boom', 'it should return the correct error message')
  }

  sendPostStub.restore()
  t.end()
})
