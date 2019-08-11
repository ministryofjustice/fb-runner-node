const test = require('tape')
const {stub, useFakeTimers} = require('sinon')

const jwt = require('jsonwebtoken')

const FBUserDataStoreClient = require('./fb-save-return-client')

/* test values */
const userId = 'testUserId'
const userToken = 'testUserToken'
const serviceSlug = 'testServiceSlug'
const serviceToken = 'testServiceToken'
const serviceSecret = 'testServiceSecret'
const saveReturnUrl = 'https://savereturn'
const createEndpointUrl = `${saveReturnUrl}/service/${serviceSlug}/user/${userId}`
const setEndpointUrl = createEndpointUrl
const payload = {foo: 'bar'}
const encryptedPayload = 'RRqDeJRQlZULKx1NYql/imRmDsy9AZshKozgLuY='

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
    t.throws(failedClient = new FBUserDataStoreClient(...params))
  } catch (e) {
    t.equal(e.name, 'FBSaveReturnClientError', 'it should return an error of the correct type')
    t.equal(e.code, expectedCode, 'it should return the correct error code')
    t.equal(e.message, expectedMessage, 'it should return the correct error message')
  }
  t.equal(failedClient, undefined, 'it should not return an instantiated client')
  t.end()
}

test('When instantiating save and return client without a service token', t => {
  testInstantiation(t, [serviceSecret], 'ENOSERVICETOKEN', 'No service token passed to client')
})

test('When instantiating save and return client without a service slug', t => {
  testInstantiation(t, [serviceSecret, serviceToken], 'ENOSERVICESLUG', 'No service slug passed to client')
})

test('When instantiating save and return client without a save and return url', t => {
  testInstantiation(t, [serviceSecret, serviceToken, serviceSlug], 'ENOMICROSERVICEURL', 'No microservice url passed to client')
})

test('When instantiating save and return client without a service secret', t => {
  testInstantiation(t, [undefined, serviceToken, serviceSlug, saveReturnUrl], 'ENOSERVICESECRET', 'No service secret passed to client')
})

// Set up a client to test the methods
const saveReturnClient = new FBUserDataStoreClient(serviceSecret, serviceToken, serviceSlug, saveReturnUrl)

// Error class
test('When throwing errors', t => {
  t.equal(saveReturnClient.ErrorClass.name, 'FBSaveReturnClientError', 'it should use the client\'s error class')

  t.end()
})

// Endpoint URLs
test('When asking for endpoint urls', t => {
  const getUrl =
  saveReturnClient.createEndpointUrl('/service/:serviceSlug/user/:userId', {serviceSlug, userId})
  t.equal(getUrl, createEndpointUrl, 'it should return the correct value for the get endpoint')
  const setUrl =
  saveReturnClient.createEndpointUrl('/service/:serviceSlug/user/:userId', {serviceSlug, userId})
  t.equal(setUrl, setEndpointUrl, 'it should return the correct value for the set endpoint')

  t.end()
})

// JWT
test('When generating json web token', async t => {
  const clock = useFakeTimers({
    now: 1483228800000
  })
  const accessToken = saveReturnClient.generateAccessToken({payload: 'testPayload'})
  const decodedAccessToken = jwt.verify(accessToken, serviceToken)
  t.equal(decodedAccessToken.checksum, 'e236cbfa627a1790355fca6aa1afbf322dad7ec025dad844b4778923a5659f06', 'it should output a token containing a checksum of the data')
  t.equal(decodedAccessToken.iat, 1483228800, 'it should output a token containing the iat property')

  clock.restore()
  t.end()
})

// Decrypting user data
test('When decrypting the user’s data', async t => {
  const decryptedPayload = saveReturnClient.decrypt(userToken, encryptedPayload)
  t.deepEqual(payload, decryptedPayload, 'it should return the correct payload from valid encrypted input')

  t.end()
})

test('When decrypting invalid data', async t => {
  let invalidPayload
  try {
    t.throws(invalidPayload = saveReturnClient.decrypt(userToken, 'invalid'))
  } catch (e) {
    t.equal(e.name, 'FBSaveReturnClientError', 'it should return an error object of the correct type')
    t.equal(e.code, 500, 'it should return correct error code')
    t.equal(e.message, 'EINVALIDPAYLOAD', 'it should return the correct error message')
  }
  t.equal(invalidPayload, undefined, 'it should not return anything if payload is invalid')

  t.end()
})

// Encrypting user data
test('When encrypting the user’s data', async t => {
  const encryptedPayload = saveReturnClient.encrypt(userToken, payload)
  const decryptedPayload = saveReturnClient.decrypt(userToken, encryptedPayload)
  t.deepEqual(payload, decryptedPayload, 'it should encrypt the payload correctly')
  // NB. have to decrypt the encryptedPayload to check
  // since the Initialization Vector guarantees the output will be different each time

  const encryptedPayloadAgain = saveReturnClient.encrypt(userToken, payload)
  t.notEqual(encryptedPayloadAgain, encryptedPayload, 'it should not return the same value for the same input')

  t.end()
})

// // Fetching user data
// test('When requesting user data that exists with a valid key', async t => {
//   const sendGetStub = stub(saveReturnClient, 'sendGet')
//   sendGetStub.callsFake(options => {
//     return Promise.resolve({
//       iat: 23232323,
//       payload: encryptedPayload
//     })
//   })
//   const logger = {error: () => {}}

//   const decryptedPayload = await saveReturnClient.getData({userId, userToken}, logger)

//   const callArgs = sendGetStub.getCall(0).args
//   t.deepEqual(callArgs[0], {
//     url: '/service/:serviceSlug/user/:userId',
//     context: {serviceSlug: 'testServiceSlug', userId: 'testUserId'}
//   }, 'it should pass the correct args to the send method')
//   t.deepEqual(callArgs[1], logger, 'it should pass any logger instance to the send method')

//   t.deepEqual(decryptedPayload, payload, 'it should decrypt the returned data')

//   sendGetStub.restore()
//   t.end()
// })

// test('When requesting user data results in an error', async t => {
//   const sendGetStub = stub(saveReturnClient, 'sendGet')
//   sendGetStub.callsFake(options => {
//     return Promise.reject(new Error('boom'))
//   })

//   try {
//     t.throws(await saveReturnClient.getData({userId, userToken}))
//   } catch (e) {
//     t.deepEqual(e.name, 'Error', 'it should return the correct error type')
//     t.deepEqual(e.message, 'boom', 'it should return the correct error message')
//   }

//   sendGetStub.restore()
//   t.end()
// })

// // Storing user data
// test('When updating user data', async t => {
//   const sendPostStub = stub(saveReturnClient, 'sendPost')
//   sendPostStub.callsFake(options => {
//     return Promise.resolve({
//       body: ''
//     })
//   })
//   const encryptStub = stub(saveReturnClient, 'encrypt')
//   encryptStub.callsFake(() => 'encryptedPayload')

//   const logger = {error: () => {}}
//   const responseBody = await saveReturnClient.setData({userId, userToken, payload}, logger)

//   const callArgs = sendPostStub.getCall(0).args
//   t.equal(callArgs[0].url, '/service/:serviceSlug/user/:userId', 'it should pass the correct url pattern')
//   t.deepEqual(callArgs[0].context, {serviceSlug: 'testServiceSlug', userId: 'testUserId'}, 'it should pass the correct url context')
//   t.deepEqual(callArgs[0].payload, {payload: 'encryptedPayload'}, 'it should pass the correct encrypted payload')
//   t.deepEqual(callArgs[1], logger, 'it should pass any logger instance to the send method')

//   t.equal(responseBody, undefined, 'it should return no content')

//   sendPostStub.restore()
//   t.end()
// })

// test('When updating user data results in an error', async t => {
//   const sendPostStub = stub(saveReturnClient, 'sendPost')
//   sendPostStub.callsFake(options => {
//     return Promise.reject(new Error('boom'))
//   })

//   try {
//     t.throws(await saveReturnClient.setData({userId, userToken, payload}))
//   } catch (e) {
//     t.deepEqual(e.name, 'Error', 'it should return the correct error type')
//     t.deepEqual(e.message, 'boom', 'it should return the correct error message')
//   }

//   sendPostStub.restore()
//   t.end()
// })
