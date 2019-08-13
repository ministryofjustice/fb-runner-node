const test = require('tape')
const {stub, useFakeTimers} = require('sinon')
const proxyquire = require('proxyquire')

const emailClient = require('../../../client/email/email')
const smsClient = require('../../../client/sms/sms')

const serviceData = require('../../../service-data/service-data')
const getInstanceStub = stub(serviceData, 'getInstance')
const getInstancePropertyStub = stub(serviceData, 'getInstanceProperty')

const format = require('../../../format/format')
const formatStub = stub(format, 'format')

const resetUserDataStub = stub()
const getUserDataPropertyStub = stub()
const setUserDataPropertyStub = stub()
const unsetUserDataPropertyStub = stub()
const userData = {
  resetUserData: resetUserDataStub,
  getUserDataProperty: getUserDataPropertyStub,
  setUserDataProperty: setUserDataPropertyStub,
  unsetUserDataProperty: unsetUserDataPropertyStub
}

const savereturn = proxyquire('./savereturn', {
  '../../../client/email/email': emailClient,
  '../../../client/sms/sms': smsClient,
  '../../../service-data/service-data': serviceData,
  '../../../format/format': format
})

const {
  client,
  handleValidationError,
  resetUser,
  authenticate,
  deauthenticate,
  getConfig
  // getEmailMessage,
  // getSmsMessage,
  // sendEmail,
  // sendSMS
} = savereturn

const resetStubs = () => {
  getInstanceStub.resetHistory()
  getInstanceStub.returns()
  getInstancePropertyStub.resetHistory()
  formatStub.resetHistory()
  resetUserDataStub.resetHistory()
  getUserDataPropertyStub.resetHistory()
  setUserDataPropertyStub.resetHistory()
}

const userDetails = {
  userId: 'userId',
  userToken: 'userToken',
  email: 'user@example.com',
  mobile: '01234654321'
}
const userDetailsWithoutMobile = {
  userId: 'userId2',
  userToken: 'userToken2',
  email: 'user2@example.com'
}

test('When requiring the savereturn module', t => {
  const expectedClient = require('./client/save-return')
  t.equal(client, expectedClient, 'it should export the save and return client')
  t.end()
})

test('When handling an error that is a 401 and has a message that can be mapped to an iinstance', t => {
  resetStubs()
  const errorInstance = {_id: 'boom'}
  getInstanceStub.returns(errorInstance)

  const instance = handleValidationError({code: 401, message: 'boom'}, 'instance')
  t.deepEqual(instance, errorInstance, 'it should return the error instance in place of the original page instance')
  t.end()
})

test('When handling an error that is a 401 and has a message that cannot be mapped to an iinstance', t => {
  resetStubs()

  try {
    t.throws(handleValidationError({code: 401, message: 'boom'}, 'instance'))
  } catch (e) {
    t.deepEqual(e, {code: 401, message: 'boom'}, 'it should throw the error')
  }
  t.end()
})

test('When handling an error that is not a 401', t => {
  resetStubs()
  const errorInstance = {_id: 'boom'}
  getInstanceStub.returns(errorInstance)

  try {
    t.throws(handleValidationError({code: 402, message: 'boom'}, 'instance'))
  } catch (e) {
    t.deepEqual(e, {code: 402, message: 'boom'}, 'it should throw the error')
  }
  t.end()
})

test('When handling an error that has no message', t => {
  resetStubs()
  const errorInstance = {_id: 'boom'}
  getInstanceStub.returns(errorInstance)

  try {
    t.throws(handleValidationError({code: 401}, 'instance'))
  } catch (e) {
    t.deepEqual(e, {code: 401}, 'it should throw the error')
  }
  t.end()
})

test('When resetting a user that has provided a mobile number', async t => {
  resetStubs()

  await resetUser(userData, userDetails)

  t.ok(resetUserDataStub.calledOnce)
  t.deepEqual(resetUserDataStub.getCall(0).args, ['userId', 'userToken'], 'it should reset the user’s data')

  t.ok(setUserDataPropertyStub.calledTwice)
  t.deepEqual(setUserDataPropertyStub.getCall(0).args, ['email', 'user@example.com'], 'it should set the user’s email address')
  t.deepEqual(setUserDataPropertyStub.getCall(1).args, ['mobile', '01234654321'], 'it should set the user’s mobile number')
  t.end()
})

test('When resetting a user that has not provided a mobile number', async t => {
  resetStubs()

  await resetUser(userData, userDetailsWithoutMobile)

  t.ok(resetUserDataStub.calledOnce)
  t.deepEqual(resetUserDataStub.getCall(0).args, ['userId2', 'userToken2'], 'it should reset the user’s data')

  t.ok(setUserDataPropertyStub.calledOnce)
  t.deepEqual(setUserDataPropertyStub.getCall(0).args, ['email', 'user2@example.com'], 'it should set the user’s email address')
  t.end()
})

test('When authenticating a user', async t => {
  resetStubs()

  const clock = useFakeTimers({
    now: 1483228800000
  })

  await authenticate(userData, 'inward-bound')

  t.ok(setUserDataPropertyStub.calledThrice, 'it should set the expected number of user properties')
  t.deepEqual(setUserDataPropertyStub.getCall(0).args, ['authenticated', true], 'it should set the user’s authencticated status')
  t.deepEqual(setUserDataPropertyStub.getCall(1).args, ['loginTime', 1483228800000], 'it should set the user’s login time')
  t.deepEqual(setUserDataPropertyStub.getCall(2).args, ['history', [{phase: 'inward-bound', date: 1483228800000}]], 'it should update the user’s login history')

  clock.restore()

  t.end()
})

test('When deauthenticating a user', async t => {
  resetStubs()

  const clock = useFakeTimers({
    now: 1483228800000
  })

  await deauthenticate(userData)

  t.ok(unsetUserDataPropertyStub.calledOnce, 'it should unset the expected number of user properties')
  t.deepEqual(unsetUserDataPropertyStub.getCall(0).args, ['authenticated'], 'it should unset the user’s authenticated stattus')

  t.ok(setUserDataPropertyStub.calledOnce, 'it should set the expected number of user properties')
  t.deepEqual(setUserDataPropertyStub.getCall(0).args, ['history', [{phase: 'deauthenticate', date: 1483228800000}]], 'it should update the user’s login history')

  clock.restore()

  t.end()
})

test('When getting module config', t => {
  resetStubs()

  getInstancePropertyStub.returns('bar')

  t.equal(getConfig('foo'), 'bar', 'it should return config values that exist')

  getInstancePropertyStub.callsFake((_id, prop, defaultValue) => defaultValue)
  t.equal(getConfig('foo'), undefined, 'it should return undefined for config values that do not exist')
  t.equal(getConfig('foo', 'bar'), 'bar', 'it should return default value if provided for config values that do not exist')

  t.end()
})
