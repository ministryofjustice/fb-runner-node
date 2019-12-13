const test = require('tape')
const {stub, useFakeTimers} = require('sinon')

const jwt = require('jsonwebtoken')

const FBSubmitterClient = require('./fb-submitter-client')

/* test values */
const userId = 'testUserId'
const submissionId = 'testSubmissionId'
const userToken = 'testUserToken'
const serviceSlug = 'testServiceSlug'
const serviceToken = 'testServiceToken'
const serviceSecret = 'testServiceSecret'
const submitterUrl = 'https://submitter'
const submissionEndpointUrl = `${submitterUrl}/submission`
const statusEndpointUrl = `${submitterUrl}/submission/${submissionId}`
const userIdTokenData = {userId, userToken}
const encryptedUserIdTokenData = 'Ejo7ypk1TFQNAbbkUFW8NeQhcZt1Wxf1IJNLhDjbtpoUdfluylSqWDCRXuulEqMiCdiQzhjIeLHANj9mMK0sMl6jTA=='
const expectedEncryptedData = 'pOXXs5YW9mUW1weBLNawiMRFdk6Hh92YBfGqmg8ych8PqnZ5l8JbcqHXHKjmcrKYJqZXn53sFr/eCq7Mbh5j9rj87w=='

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
    t.throws(failedClient = new FBSubmitterClient(...params))
  } catch (e) {
    t.equal(e.name, 'FBSubmitterClientError', 'it should return an error of the correct type')
    t.equal(e.code, expectedCode, 'it should return the correct error code')
    t.equal(e.message, expectedMessage, 'it should return the correct error message')
  }
  t.equal(failedClient, undefined, 'it should not return an instantiated client')
  t.end()
}

test('When instantiating submitter client without a service token', t => {
  testInstantiation(t, [serviceSecret], 'ENOSERVICETOKEN', 'No service token passed to client')
})

test('When instantiating submitter client without a service slug', t => {
  testInstantiation(t, [serviceSecret, serviceToken], 'ENOSERVICESLUG', 'No service slug passed to client')
})

test('When instantiating submitter client without a submitter url', t => {
  testInstantiation(t, [serviceSecret, serviceToken, serviceSlug], 'ENOMICROSERVICEURL', 'No microservice url passed to client')
})

test('When instantiating submitter client without a service secret', t => {
  testInstantiation(t, [undefined, serviceToken, serviceSlug, submitterUrl], 'ENOSERVICESECRET', 'No service secret passed to client')
})

// Set up a client to test the methods
const submitterClient = new FBSubmitterClient(serviceSecret, serviceToken, serviceSlug, submitterUrl)

// Endpoint URLs
test('When asking for endpoint urls', t => {
  const getUrl =
  submitterClient.createEndpointUrl('/submission')
  t.equal(getUrl, submissionEndpointUrl, 'it should return the correct value for the get endpoint')
  const setUrl =
  submitterClient.createEndpointUrl('/submission/:submissionId', {submissionId})
  t.equal(setUrl, statusEndpointUrl, 'it should return the correct value for the set endpoint')

  t.end()
})

// JWT
test('When generating json web token', async t => {
  const clock = useFakeTimers({
    now: 1483228800000
  })
  const accessToken = submitterClient.generateAccessToken({data: 'testData'}, serviceToken, 'HS256')
  const decodedAccessToken = jwt.verify(accessToken, serviceToken, 'HS256')
  t.equal(decodedAccessToken.checksum, 'b5118e71a8ed3abbc8c40d4058b0dd54b9410ffd56ef888f602ed10026c46a3a', 'it should output a token containing a checksum of the data')
  t.equal(decodedAccessToken.iat, 1483228800, 'it should output a token containing the iat property')

  clock.restore()
  t.end()
})

// Decrypting user ID and token
test('When decrypting the user’s ID and token', async t => {
  const decryptedData = submitterClient.decryptUserIdAndToken(encryptedUserIdTokenData)
  t.deepEqual(userIdTokenData, decryptedData, 'it should return the correct data from valid encrypted input')

  t.end()
})

test('When decrypting invalid user ID and token', async t => {
  let invalidData
  try {
    t.throws(invalidData = submitterClient.decryptUserIdAndToken(userToken, 'invalid'))
  } catch (e) {
    t.equal(e.name, 'FBSubmitterClientError', 'it should return an error object of the correct type')
    t.equal(e.code, 500, 'it should return correct error code')
    t.equal(e.message, 'EINVALIDPAYLOAD', 'it should return the correct error message')
  }
  t.equal(invalidData, undefined, 'it should not return anything if data is invalid')

  t.end()
})

// Encrypting user ID and token
test('When encrypting the user ID and token', async t => {
  const encryptedData = submitterClient.encryptUserIdAndToken(userId, userToken)
  t.equal(encryptedData, expectedEncryptedData, 'it should encrypt the data correctly')

  const encryptedDataAgain = submitterClient.encryptUserIdAndToken(userId, userToken)
  t.equal(encryptedDataAgain, encryptedData, 'it should return the same value for the same input')

  t.end()
})

// Getting submission status
test('When requesting submission status', async t => {
  const statusData = {
    id: submissionId,
    created_at: '2018-10-15T10:13:35Z',
    updated_at: '2018-10-15T10:13:35Z',
    status: 'queued'
  }
  const sendGetStub = stub(submitterClient, 'sendGet')
  sendGetStub.callsFake(options => {
    return Promise.resolve(statusData)
  })
  const logger = {}

  const decryptedData = await submitterClient.getStatus(submissionId, logger)

  const callArgs = sendGetStub.getCall(0).args
  t.equal(callArgs[0].url, '/submission/:submissionId', 'it should pass the correct url to the sendGet method')
  t.deepEqual(callArgs[0].context, {submissionId: 'testSubmissionId'}, 'it should pass the correct url context to the sendGet method')
  t.equal(callArgs[1], logger, 'it should pass any logger instance to the sendGet method')

  t.deepEqual(decryptedData, statusData, 'it should return the unencrypted data')

  sendGetStub.restore()
  t.end()
})

// Submitting user instructions
test('When sending user instructions to submitter', async t => {
  const sendPostStub = stub(submitterClient, 'sendPost')
  sendPostStub.callsFake(options => {
    return Promise.resolve('')
  })
  const encryptStub = stub(submitterClient, 'encryptUserIdAndToken')
  encryptStub.callsFake(() => encryptedUserIdTokenData)

  const submissions = {
    submission_details: { // deprecated
      type: 'email'
    },
    submission: {
      foo: 1
    },
    actions: [],
    attachments: []
  }

  const expectedJSON = {
    service_slug: serviceSlug,
    encrypted_user_id_and_token: encryptedUserIdTokenData,
    ...submissions
  }
  const logger = {}

  const responseBody = await submitterClient.submit(submissions, userId, userToken, logger)

  const callArgs = sendPostStub.getCall(0).args
  t.equal(callArgs[0].url, '/submission', 'it should pass the correct url to the sendPost method')
  t.equal(callArgs[0].context, undefined, 'it should pass the correct context to the sendPost method')
  t.deepEqual(callArgs[0].payload, expectedJSON, 'it should pass the correct data to the sendPost method')
  t.equal(callArgs[1], logger, 'it should pass any logger instance to the sendGet method')

  t.equal(responseBody, undefined, 'it should return no content')

  sendPostStub.restore()
  encryptStub.restore()
  t.end()
})

// Offline version
test('When calling the submit method with the offline version of the client', async t => {
  const offlineClient = FBSubmitterClient.offline()
  const submitted = await offlineClient.submit({})

  t.equal(submitted, undefined, 'it should return undefined')
  t.end()
})
