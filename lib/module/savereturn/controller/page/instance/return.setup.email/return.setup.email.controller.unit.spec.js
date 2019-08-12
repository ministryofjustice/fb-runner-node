const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const getUserDataPropertyStub = stub()
getUserDataPropertyStub.callsFake(prop => {
  if (prop === 'email') {
    return 'email@example.com'
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

const sendEmailStub = stub(savereturn, 'sendEmail')
const getConfigStub = stub(savereturn, 'getConfig')
const {client} = savereturn
const createSetupEmailTokenStub = stub(client, 'createSetupEmailToken')
createSetupEmailTokenStub.returns('token')

const ReturnEmailController = proxyquire('./return.setup.email.controller', {
  '../../../savereturn': savereturn
})

const resetStubs = () => {
  sendEmailStub.resetHistory()
  getConfigStub.resetHistory()
  getConfigStub.callsFake(type => {
    if (type === 'emailTokenDuration') {
      return 100
    }
  })
  createSetupEmailTokenStub.resetHistory()
}

test('When a user provides an email to set up save and return with', async t => {
  resetStubs()

  await ReturnEmailController.postValidation({}, userData)

  t.ok(createSetupEmailTokenStub.calledOnce, 'it should request the creation of an email token')
  t.deepEqual(createSetupEmailTokenStub.getCall(0).args, ['userId', 'userToken', 'email@example.com', 100, loggerStub], 'it should call createMagiclink with the expected args')

  t.ok(sendEmailStub.calledOnce, 'it should send an email containing the email token')
  t.deepEqual(sendEmailStub.getCall(0).args, ['email.return.setup.email.token', userData, {token: 'token'}], 'it should call sendEmail with the expected args')

  t.end()
})
