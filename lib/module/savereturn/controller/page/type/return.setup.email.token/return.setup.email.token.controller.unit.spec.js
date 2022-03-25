require('@ministryofjustice/module-alias/register-module')(module)

const { test } = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const getUserParamStub = sinon.stub().callsFake(prop => {
  if (prop === 'token') {
    return 'token'
  }

  if (prop === 'passphrase') {
    return 'passphrase'
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

const { client } = savereturn
const handleValidationErrorStub = sinon.stub(savereturn, 'handleValidationError')
const resetUserStub = sinon.stub(savereturn, 'resetUser')
const authenticateStub = sinon.stub(savereturn, 'authenticate')
const sendEmailStub = sinon.stub(savereturn, 'sendEmail')
const validateSetupEmailTokenStub = sinon.stub(client, 'validateSetupEmailToken')

const createRecordStub = sinon.stub(client, 'createRecord')

class mockCommonController {}

const SetupEmailTokenController = proxyquire('./return.setup.email.token.controller', {
  '~/fb-runner-node/module/savereturn/controller/page/common': mockCommonController,
  '~/fb-runner-node/module/savereturn/controller/savereturn': savereturn
})

const userData = {
  getUserParam: getUserParamStub,
  logger: loggerStub
}

const userDetails = {
  userId: 'userId',
  userToken: 'userToken',
  email: 'email'
}

const resetStubs = () => {
  getUserParamStub.resetHistory()
  handleValidationErrorStub.resetHistory()
  resetUserStub.resetHistory()
  authenticateStub.resetHistory()
  sendEmailStub.resetHistory()
  validateSetupEmailTokenStub.resetHistory()
  validateSetupEmailTokenStub.returns(userDetails)
  createRecordStub.resetHistory()
}

test('When a user verifies their email token', async t => {
  resetStubs()

  const setupEmailTokenController = new SetupEmailTokenController()

  const pageInstance = await setupEmailTokenController.preUpdateContents({}, userData)

  t.ok(validateSetupEmailTokenStub.calledOnce, 'it should validate the email token')
  t.same(validateSetupEmailTokenStub.getCall(0).args, ['token', 'passphrase', loggerStub], 'it should call validateSetupEmailToken with the expected args')

  t.ok(resetUserStub.calledOnce, 'it should reset the user')
  t.same(resetUserStub.getCall(0).args, [userData, userDetails], 'it should call resetUser with the expected args')

  t.ok(createRecordStub.calledOnce, 'it should create a save and return record for the user')
  t.same(createRecordStub.getCall(0).args, ['userId', 'userToken', 'email', undefined, loggerStub], 'it should call createRecord with the expected args')

  t.ok(authenticateStub.calledOnce, 'it should authenticate the user')
  t.same(authenticateStub.getCall(0).args, [userData, 'setup-email'], 'it should call authenticate with the expected args')

  t.ok(sendEmailStub.calledOnce, 'it should send an email stating that the user has set up save and return successfully')
  t.same(sendEmailStub.getCall(0).args, ['email.return.setup.email.verified', userData], 'it should call sendEmail with the expected args')

  t.equal(pageInstance.redirect, 'return.setup.success', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user tries to verify an email token that is not valid', async t => {
  resetStubs()

  const error = new Error('Mock Error')

  validateSetupEmailTokenStub.callsFake(() => {
    throw error
  })

  const setupEmailTokenController = new SetupEmailTokenController()

  await setupEmailTokenController.preUpdateContents({}, userData)
  t.ok(handleValidationErrorStub.calledOnce, 'it should yield to the error handler')
  t.same(handleValidationErrorStub.getCall(0).args, [error, 'return.setup.email'], 'it should call handleValidationError with the expected args')

  t.end()
})
