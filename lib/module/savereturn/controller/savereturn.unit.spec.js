const test = require('tape')
const {stub, useFakeTimers} = require('sinon')
const proxyquire = require('proxyquire')

const emailClient = {
  sendMessage: () => {}
}
const emailClientStub = stub(emailClient, 'sendMessage')
const smsClient = {
  sendMessage: () => {}
}
const smsClientStub = stub(smsClient, 'sendMessage')

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
  logger: 'loggerFn',
  resetUserData: resetUserDataStub,
  getUserDataProperty: getUserDataPropertyStub,
  setUserDataProperty: setUserDataPropertyStub,
  unsetUserDataProperty: unsetUserDataPropertyStub,
  getScopedUserData: () => ({
    some: 'value'
  })
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
  getConfig,
  getMessage,
  sendEmail,
  sendSMS
} = savereturn

const resetStubs = () => {
  getInstanceStub.resetHistory()
  getInstanceStub.returns()
  getInstancePropertyStub.resetHistory()
  formatStub.resetHistory()
  formatStub.callsFake(str => {
    return str
  })
  resetUserDataStub.resetHistory()
  getUserDataPropertyStub.resetHistory()
  setUserDataPropertyStub.resetHistory()
  emailClientStub.resetHistory()
  smsClientStub.resetHistory()
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
  t.deepEqual(setUserDataPropertyStub.getCall(0).args, ['authenticated', true], 'it should set the user’s authenticated status')
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
  t.deepEqual(unsetUserDataPropertyStub.getCall(0).args, ['authenticated'], 'it should unset the user’s authenticated status')

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

const emailInstance = {
  _id: 'email.test',
  _type: 'emailMessage',
  body: 'body',
  from: 'from',
  subject: 'subject',
  template_name: 'email.test',
  to: 'to',
  number: 4,
  array: [],
  $prop: '$ prop'
}

test('When getting messages', async t => {
  getInstanceStub.withArgs('email.test').returns(emailInstance)
  formatStub.callsFake(str => `${str}:formatted`)

  const message = getMessage('email.test', userData, {data_foo: 'dbar'}, {personalisation_foo: 'pbar'})

  const formatData = {some: 'value', data_foo: 'dbar'}
  const formatOptions = {markdown: false}

  const expectedProperties = ['body', 'from', 'subject', 'to']
  expectedProperties.forEach((prop, index) => {
    t.deepEqual(formatStub.getCall(index).args, [prop, formatData, formatOptions], `it should format the ${prop} property`)
  })

  t.deepEqual(message, {
    _id: 'email.test',
    _type: 'emailMessage',
    body: 'body:formatted',
    from: 'from:formatted',
    subject: 'subject:formatted',
    template_name: 'email.test',
    to: 'to:formatted',
    number: 4,
    array: [],
    $prop: '$ prop',
    extra_personalisation: {personalisation_foo: 'pbar'}
  }, 'it should return the expected message data')

  t.end()
})

test('When sending emails', async t => {
  const getEmailMessageStub = stub(savereturn, 'getEmailMessage')
  getEmailMessageStub.returns({_id: 'email.test'})

  await sendEmail('email.test', userData, {data_foo: 'dbar'}, {personalisation_foo: 'pbar'})

  t.ok(getEmailMessageStub.calledOnce, 'it should get the email message instance')
  t.deepEqual(getEmailMessageStub.getCall(0).args, [
    'email.test',
    userData,
    {data_foo: 'dbar'},
    {personalisation_foo: 'pbar'}
  ], 'it should call getMessage with the expected args')

  t.ok(emailClientStub.calledOnce, 'it should send the email message')
  t.deepEqual(emailClientStub.getCall(0).args, [{_id: 'email.test'}, {}, userData.logger], 'it should call emailClient.sendMessage with the expected args')

  getEmailMessageStub.restore()
  t.end()
})

test('When sending sms messages', async t => {
  const getSMSMessageStub = stub(savereturn, 'getSMSMessage')
  getSMSMessageStub.returns({_id: 'sms.test'})

  await sendSMS('sms.test', userData, {data_foo: 'dbar'}, {personalisation_foo: 'pbar'})

  t.ok(getSMSMessageStub.calledOnce, 'it should get the sms message instance')
  t.deepEqual(getSMSMessageStub.getCall(0).args, [
    'sms.test',
    userData,
    {data_foo: 'dbar'},
    {personalisation_foo: 'pbar'}
  ], 'it should call getMessage with the expected args')

  t.ok(smsClientStub.calledOnce, 'it should send the sms message')
  t.deepEqual(smsClientStub.getCall(0).args, [{_id: 'sms.test'}, {}, userData.logger], 'it should call smsClient.sendMessage with the expected args')

  getSMSMessageStub.restore()
  t.end()
})
