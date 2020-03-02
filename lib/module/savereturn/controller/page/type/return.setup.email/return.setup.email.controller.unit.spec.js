require('@ministryofjustice/module-alias/register-module')(module)

const { test } = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const getUserDataPropertyStub = sinon.stub().callsFake(prop => {
  if (prop === 'email') {
    return 'email@example.com'
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

const {
  client
} = savereturn
const sendEmailStub = sinon.stub(savereturn, 'sendEmail')
sinon.stub(savereturn, 'getConfig').callsFake(type => {
  if (type === 'emailTokenDuration') {
    return 100
  }
})
const createSetupEmailTokenStub = sinon.stub(client, 'createSetupEmailToken').returns('token')

envVars.forEach(envVar => {
  process.env[envVar] = 'test'
})

envVars.forEach(envVar => {
  delete process.env[envVar]
})

const userData = {
  getUserId: () => 'userId',
  getUserToken: () => 'userToken',
  getUserDataProperty: getUserDataPropertyStub,
  logger: loggerStub
}

class mockCommonController {}

const SetupEmailController = proxyquire('./return.setup.email.controller', {
  '~/fb-runner-node/module/savereturn/controller/page/common': mockCommonController,
  '~/fb-runner-node/module/savereturn/controller/savereturn': savereturn
})

test('When a user provides an email to set up save and return with', async t => {
  const setupEmailController = new SetupEmailController()

  await setupEmailController.postValidation({}, userData)

  t.ok(createSetupEmailTokenStub.calledOnce, 'it should request the creation of an email token')
  t.deepEqual(createSetupEmailTokenStub.getCall(0).args, ['userId', 'userToken', 'email@example.com', 100, loggerStub], 'it should call createMagiclink with the expected args')

  t.ok(sendEmailStub.calledOnce, 'it should send an email containing the email token')
  t.deepEqual(sendEmailStub.getCall(0).args, ['email.return.setup.email.token', userData, { token: 'token' }], 'it should call sendEmail with the expected args')

  t.end()
})
