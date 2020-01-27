const test = require('tape')
const { stub, useFakeTimers } = require('sinon')
const proxyquire = require('proxyquire')
const FBJWTClient = require('@ministryofjustice/fb-client/lib/user/jwt/client')

const jwt = require('jsonwebtoken')

const FBUserDataStoreClient = proxyquire('./fb-save-return-client', {
  '@ministryofjustice/fb-client/lib/user/jwt/client': FBJWTClient
})

/* test values */
const userId = 'testUserId'
const serviceSlug = 'testServiceSlug'
const serviceToken = 'testServiceToken'
const serviceSecret = 'testServiceSecret'
const saveReturnUrl = 'https://savereturn'
const createEndpointUrl = `${saveReturnUrl}/service/${serviceSlug}/user/${userId}`
const setEndpointUrl = createEndpointUrl

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
    t.equal(e.name, 'SaveReturnClientError', 'it should return an error of the correct type')
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

const encryptStub = stub(saveReturnClient, 'encrypt')
const decryptStub = stub(saveReturnClient, 'decrypt')
const FBJWTClientSendPostStub = stub(FBJWTClient.prototype, 'sendPost')

const resetStubs = () => {
  FBJWTClientSendPostStub.resetHistory()
  FBJWTClientSendPostStub.returns('')
  encryptStub.resetHistory()
  encryptStub.callsFake((secret, str, iv) => {
    str = `${str}/encryptedPayload`
    if (iv) {
      str += '/with-iv'
    }
    return str
  })
  decryptStub.resetHistory()
  decryptStub.callsFake((secret, str) => `${str}/decryptedPayload`)
}

// Error class
test('When throwing errors', t => {
  t.equal(saveReturnClient.ErrorClass.name, 'SaveReturnClientError', 'it should use the client\'s error class')

  t.end()
})

// Endpoint URLs
test('When asking for endpoint urls', t => {
  const getUrl =
  saveReturnClient.createEndpointUrl('/service/:serviceSlug/user/:userId', { serviceSlug, userId })
  t.equal(getUrl, createEndpointUrl, 'it should return the correct value for the get endpoint')
  const setUrl =
  saveReturnClient.createEndpointUrl('/service/:serviceSlug/user/:userId', { serviceSlug, userId })
  t.equal(setUrl, setEndpointUrl, 'it should return the correct value for the set endpoint')

  t.end()
})

// JWT
test('When generating json web token', async t => {
  const clock = useFakeTimers({
    now: 1483228800000
  })
  const accessToken = saveReturnClient.generateAccessToken({ payload: 'testPayload' }, serviceToken, 'HS256')
  const decodedAccessToken = jwt.verify(accessToken, serviceToken, 'HS256')
  t.equal(decodedAccessToken.checksum, 'e236cbfa627a1790355fca6aa1afbf322dad7ec025dad844b4778923a5659f06', 'it should output a token containing a checksum of the data')
  t.equal(decodedAccessToken.iat, 1483228800, 'it should output a token containing the iat property')

  clock.restore()
  t.end()
})

// Sending data
test('When calling the save and return sendPost method', async t => {
  resetStubs()

  const logger = { error: () => {} }
  const responseBody = await saveReturnClient.sendPost({
    url: '/foo',
    payload: {
      a: 'a'
    }
  }, logger)

  const basicArgs = FBJWTClientSendPostStub.getCall(0).args

  t.deepEqual(basicArgs[1], logger, 'it should pass any supplied logger to the super method in FBJWTClient')

  t.deepEqual(basicArgs[0], {
    url: '/service/:serviceSlug/savereturn/foo',
    payload: {
      a: 'a'
    },
    context: { serviceSlug: 'testServiceSlug' }
  }, 'it should invoke the super method in FBJWTClient with the correct args')

  t.deepEqual(responseBody, '', 'it should return the response body from the super method in FBJWTClient')

  await saveReturnClient.sendPost({
    url: '/foo',
    payload: {
      encrypted_a: 'a'
    }
  })

  const encryptedArgs = FBJWTClientSendPostStub.getCall(1).args
  t.deepEqual(encryptedArgs[0].payload, {
    encrypted_a: 'a/encryptedPayload'
  }, 'it should encrypt any payload properties beginning with encrypted_')

  await saveReturnClient.sendPost({
    url: '/foo',
    payload: {
      encrypted_email: 'a'
    }
  })

  const encryptedEmailArgs = FBJWTClientSendPostStub.getCall(2).args
  t.deepEqual(encryptedEmailArgs[0].payload, {
    encrypted_email: 'a/encryptedPayload/with-iv'
  }, 'it should encrypt email property with fixed initialisation vector')

  FBJWTClientSendPostStub.returns({
    a: 'a',
    encrypted_b: 'b'
  })
  const response = await saveReturnClient.sendPost({
    url: '/foo',
    payload: {
      encrypted_a: 'a'
    }
  })

  t.deepEqual(response, { a: 'a', encrypted_b: 'b', b: 'b/decryptedPayload' }, 'it should decrypt any properties beginning with encrypted_')

  t.end()
})

test('When requesting an email token to set up save and return', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns({ token: 'token' })

  const token = await saveReturnClient.createSetupEmailToken('userId', 'userToken', 'email', 'duration', 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/setup/email/add', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    encrypted_email: 'email',
    encrypted_details: {
      userId: 'userId',
      userToken: 'userToken',
      email: 'email'
    },
    duration: 'duration'
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(token, 'token', 'it should return the token')

  t.end()
  sendPostStub.restore()
})

test('When requesting a mobile code to set up save and return', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns({ code: 'code' })

  const code = await saveReturnClient.createSetupMobileCode('userId', 'userToken', 'email', 'mobile', 'duration', 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/setup/mobile/add', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    encrypted_email: 'email',
    encrypted_details: {
      userId: 'userId',
      userToken: 'userToken',
      email: 'email',
      mobile: 'mobile'
    },
    duration: 'duration'
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(code, 'code', 'it should return the code')

  t.end()
  sendPostStub.restore()
})

test('When validating an email token to set up save and return', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns({ details: 'details' })

  const details = await saveReturnClient.validateSetupEmailToken('emailToken', undefined, 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/setup/email/validate', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    email_token: 'emailToken'
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(details, 'details', 'it should return the details')

  await saveReturnClient.validateSetupEmailToken('emailToken', 'passphrase', 'logger')
  const argsWithPassphrase = sendPostStub.getCall(1).args[0]

  t.deepEqual(argsWithPassphrase.payload, {
    email_token: 'emailToken',
    encrypted_passphrase: 'passphrase'
  }, 'it should encrypt and add any passphrase provided in the payload')

  t.end()
  sendPostStub.restore()
})

test('When validating a mobile code to set up save and return', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns({ details: 'details' })

  const details = await saveReturnClient.validateSetupMobileCode('code', 'email', 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/setup/mobile/validate', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    code: 'code',
    encrypted_email: 'email'
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(details, 'details', 'it should return the details')

  t.end()
  sendPostStub.restore()
})

test('When creating a save and return record', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns()

  const result = await saveReturnClient.createRecord('userId', 'userToken', 'email', 'mobile', 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/record/create', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    encrypted_email: 'email',
    encrypted_details: {
      userId: 'userId',
      userToken: 'userToken',
      email: 'email',
      mobile: 'mobile'
    }
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(result, undefined, 'it should return no value')

  await saveReturnClient.createRecord('userId', 'userToken', 'email', undefined, 'logger')
  const argsWithoutMobile = sendPostStub.getCall(1).args[0]

  t.deepEqual(argsWithoutMobile.payload, {
    encrypted_email: 'email',
    encrypted_details: {
      userId: 'userId',
      userToken: 'userToken',
      email: 'email'
    }
  }, 'it should omit mobile from the payload if no mobile provided')

  t.end()
  sendPostStub.restore()
})

test('When requesting an magic link to sign in', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns({ token: 'token' })

  const token = await saveReturnClient.createMagiclink('email', 'duration', 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/signin/email/add', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    encrypted_email: 'email',
    duration: 'duration'
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(token, 'token', 'it should return the token')

  t.end()
  sendPostStub.restore()
})

test('When validating a magic link', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns({ details: 'details' })

  const details = await saveReturnClient.validateAuthenticationMagiclink('magicLink', 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/signin/email/validate', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    magiclink: 'magicLink'
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(details, 'details', 'it should return the details')

  t.end()
  sendPostStub.restore()
})

test('When requesting a mobile code to confirm sign in', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns({ code: 'code' })

  const code = await saveReturnClient.createSigninMobileCode('email', 'duration', 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/signin/mobile/add', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    encrypted_email: 'email',
    duration: 'duration'
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(code, 'code', 'it should return the code')

  t.end()
  sendPostStub.restore()
})

test('When validating a mobile code to confirm sign in', async t => {
  const sendPostStub = stub(saveReturnClient, 'sendPost')
  sendPostStub.returns({ details: 'details' })

  const details = await saveReturnClient.validateSigninMobileCode('code', 'email', 'logger')
  const args = sendPostStub.getCall(0).args
  const sendPostArgs = args[0]

  t.equal(sendPostArgs.url, '/signin/mobile/validate', 'it should use the expected url stub')
  t.deepEqual(sendPostArgs.payload, {
    code: 'code',
    encrypted_email: 'email'
  }, 'it should create the expected payload')
  t.equal(args[1], 'logger', 'it should pass through any logger instance')

  t.equal(details, 'details', 'it should return the details')

  t.end()
  sendPostStub.restore()
})
