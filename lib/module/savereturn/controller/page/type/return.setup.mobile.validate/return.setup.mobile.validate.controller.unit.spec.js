require('@ministryofjustice/module-alias/register-module')(module)

const { test } = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const getUserDataPropertyStub = sinon.stub()

const loggerStub = sinon.stub()

const envVars = [
  'SAVE_RETURN_URL',
  'SERVICE_SECRET',
  'USER_DATASTORE_URL',
  'SERVICE_SLUG',
  'SUBMITTER_URL'
]
const savereturn = require('~/fb-runner-node/module/savereturn/controller/savereturn')

envVars.forEach(envVar => {
  process.env[envVar] = 'test'
})

envVars.forEach(envVar => {
  delete process.env[envVar]
})

const handleValidationErrorStub = sinon.stub(savereturn, 'handleValidationError')
const resetUserStub = sinon.stub(savereturn, 'resetUser')
const authenticateStub = sinon.stub(savereturn, 'authenticate')
const sendEmailStub = sinon.stub(savereturn, 'sendEmail')
const { client } = savereturn
const validateSetupMobileCodeStub = sinon.stub(client, 'validateSetupMobileCode')

const createRecordStub = sinon.stub(client, 'createRecord')

class mockCommonController {}

const SetupMobileValidateController = proxyquire('./return.setup.mobile.validate.controller', {
  '~/fb-runner-node/module/savereturn/controller/page/common': mockCommonController,
  '~/fb-runner-node/module/savereturn/controller/savereturn': savereturn
})

const userData = {
  getUserDataProperty: getUserDataPropertyStub,
  logger: loggerStub
}

const userDetails = {
  userId: 'userId',
  userToken: 'userToken',
  email: 'email'
}

const resetStubs = () => {
  getUserDataPropertyStub.resetHistory()
  getUserDataPropertyStub.callsFake(prop => prop)
  handleValidationErrorStub.resetHistory()
  resetUserStub.resetHistory()
  authenticateStub.resetHistory()
  sendEmailStub.resetHistory()
  validateSetupMobileCodeStub.resetHistory()
  validateSetupMobileCodeStub.returns(userDetails)
  createRecordStub.resetHistory()
}

test('When a user attempts to register a mobile for save and return without already being authenticated', async t => {
  resetStubs()

  getUserDataPropertyStub.callsFake(prop => false)

  const setupMobileValidateController = new SetupMobileValidateController()

  const pageInstance = await setupMobileValidateController.preUpdateContents({}, userData)
  t.equal(pageInstance.redirect, 'page.start', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user attempts to verify a mobile for save and return but does not enter the verification code', async t => {
  resetStubs()

  getUserDataPropertyStub.callsFake(prop => '')

  const setupMobileValidateController = new SetupMobileValidateController()

  await setupMobileValidateController.postValidation({}, userData)

  t.ok(validateSetupMobileCodeStub.notCalled, 'it should not try to validate the mobile code')

  t.end()
})

test('When a user verifies their email token', async t => {
  resetStubs()

  const setupMobileValidateController = new SetupMobileValidateController()

  const pageInstance = await setupMobileValidateController.postValidation({}, userData)

  t.ok(validateSetupMobileCodeStub.calledOnce, 'it should validate the mobile code')
  t.deepEqual(validateSetupMobileCodeStub.getCall(0).args, ['code', 'email', loggerStub], 'it should call validateSetupMobileCode with the expected args')

  t.ok(resetUserStub.calledOnce, 'it should reset the user')
  t.deepEqual(resetUserStub.getCall(0).args, [userData, userDetails], 'it should call resetUser with the expected args')

  t.ok(createRecordStub.calledOnce, 'it should create a save and return record for the user')
  t.deepEqual(createRecordStub.getCall(0).args, ['userId', 'userToken', 'email', 'mobile', loggerStub], 'it should call createRecord with the expected args')

  t.ok(authenticateStub.calledOnce, 'it should authenticate the user')
  t.deepEqual(authenticateStub.getCall(0).args, [userData, 'setup-mobile'], 'it should call authenticate with the expected args')

  t.ok(sendEmailStub.calledOnce, 'it should send an email stating that the user has set up save and return successfully')
  t.deepEqual(sendEmailStub.getCall(0).args, ['email.return.setup.mobile.verified', userData], 'it should call sendEmail with the expected args')

  t.equal(pageInstance.redirect, 'return.setup.success', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user tries to verify a mobile token that is not valid (expired, used, superseded etc)', async t => {
  resetStubs()

  const error = new Error('Mock Error')
  validateSetupMobileCodeStub.callsFake(() => {
    throw error
  })

  const setupMobileValidateController = new SetupMobileValidateController()

  await setupMobileValidateController.postValidation({}, userData)

  t.ok(handleValidationErrorStub.calledOnce, 'it should yield to the error handler')
  t.deepEqual(handleValidationErrorStub.getCall(0).args, [error, 'return.setup.mobile'], 'it should call handleValidationError with the expected args')

  t.end()
})

test('When a user tries to verify an email token that is invalid (throwing a `code.invalid` error)', async t => {
  resetStubs()

  const error = new Error('code.invalid')
  validateSetupMobileCodeStub.callsFake(() => {
    throw error
  })

  const setupMobileValidateController = new SetupMobileValidateController()

  await setupMobileValidateController.postValidation({}, userData)

  t.ok(handleValidationErrorStub.notCalled, 'it should not yield to the error handler')

  t.end()
})
