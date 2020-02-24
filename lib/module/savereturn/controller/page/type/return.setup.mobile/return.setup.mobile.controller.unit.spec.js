require('@ministryofjustice/module-alias/register-module')(module)

const { test } = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const getUserDataPropertyStub = sinon.stub().callsFake(prop => {
  if (prop === 'email') {
    return 'email@example.com'
  }

  if (prop === 'mobile') {
    return '07290654321'
  }
})
const loggerStub = sinon.stub()

const envVars = [
  'SERVICE_SLUG',
  'SAVE_RETURN_URL',
  'SERVICE_SECRET',
  'USER_DATASTORE_URL',
  'SUBMITTER_URL',
  'ENCODED_PRIVATE_KEY'
]
const savereturn = require('~/fb-runner-node/module/savereturn/controller/savereturn')

envVars.forEach(envVar => {
  process.env[envVar] = 'test'
})

envVars.forEach(envVar => {
  delete process.env[envVar]
})

const {
  client
} = savereturn
const sendSMSStub = sinon.stub(savereturn, 'sendSMS')
sinon.stub(savereturn, 'getConfig').callsFake(type => {
  if (type === 'smsCodeDuration') {
    return 100
  }
})
const createSetupMobileCodeStub = sinon.stub(client, 'createSetupMobileCode').returns('code')

class mockCommonController {}

const SetupMobileController = proxyquire('./return.setup.mobile.controller', {
  '~/fb-runner-node/module/savereturn/controller/page/common': mockCommonController,
  '~/fb-runner-node/module/savereturn/controller/savereturn': savereturn
})

const userData = {
  getUserId: () => 'userId',
  getUserToken: () => 'userToken',
  getUserDataProperty: getUserDataPropertyStub,
  logger: loggerStub
}

test('When a user provides an email to set up save and return with', async t => {
  const setupMobileController = new SetupMobileController()

  await setupMobileController.postValidation({}, userData)

  t.ok(createSetupMobileCodeStub.calledOnce, 'it should request the creation of a mobile code')
  t.deepEqual(createSetupMobileCodeStub.getCall(0).args, ['userId', 'userToken', 'email@example.com', '07290654321', 100, loggerStub], 'it should call createSetupMobileCode with the expected args')

  t.ok(sendSMSStub.calledOnce, 'it should send an sms containing the mobile code')
  t.deepEqual(sendSMSStub.getCall(0).args, ['sms.return.setup.mobile', userData, { code: 'code' }], 'it should call sendSMS with the expected args')

  t.end()
})
