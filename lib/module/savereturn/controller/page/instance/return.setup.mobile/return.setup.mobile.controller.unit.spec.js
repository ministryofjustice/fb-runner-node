const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const getUserDataPropertyStub = stub()
getUserDataPropertyStub.callsFake(prop => {
  if (prop === 'email') {
    return 'email@example.com'
  }
  if (prop === 'mobile') {
    return '07290654321'
  }
})
const loggerStub = stub()
const userData = {
  getUserId: () => 'userId',
  getUserToken: () => 'userToken',
  getUserDataProperty: getUserDataPropertyStub,
  logger: loggerStub
}

const envVars = ['SERVICE_TOKEN', 'SERVICE_SLUG', 'SAVE_RETURN_URL', 'SERVICE_SECRET', 'USER_DATASTORE_URL']
envVars.forEach(envVar => {
  process.env[envVar] = 'test'
})
const savereturn = require('../../../savereturn')
envVars.forEach(envVar => {
  delete process.env[envVar]
})

const sendSMSStub = stub(savereturn, 'sendSMS')
const getConfigStub = stub(savereturn, 'getConfig')
const {client} = savereturn
const createSetupMobileCodeStub = stub(client, 'createSetupMobileCode')
createSetupMobileCodeStub.returns('code')

const ReturnSetupMobileController = proxyquire('./return.setup.mobile.controller', {
  '../../../savereturn': savereturn
})

const resetStubs = () => {
  sendSMSStub.resetHistory()
  getConfigStub.resetHistory()
  getConfigStub.callsFake(type => {
    if (type === 'smsCodeDuration') {
      return 100
    }
  })
  createSetupMobileCodeStub.resetHistory()
}

test('When a user provides an email to set up save and return with', async t => {
  resetStubs()

  await ReturnSetupMobileController.postValidation({}, userData)

  t.ok(createSetupMobileCodeStub.calledOnce, 'it should request the creation of a mobile code')
  t.deepEqual(createSetupMobileCodeStub.getCall(0).args, ['userId', 'userToken', 'email@example.com', '07290654321', 100, loggerStub], 'it should call createSetupMobileCode with the expected args')

  t.ok(sendSMSStub.calledOnce, 'it should send an sms containing the mobile code')
  t.deepEqual(sendSMSStub.getCall(0).args, ['sms.return.setup.mobile', userData, {code: 'code'}], 'it should call sendSMS with the expected args')

  t.end()
})
