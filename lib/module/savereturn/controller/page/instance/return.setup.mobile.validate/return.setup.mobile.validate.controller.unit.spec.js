const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const getUserDataPropertyStub = stub()

const loggerStub = stub()
const userData = {
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
const handleValidationErrorStub = stub(savereturn, 'handleValidationError')
const resetUserStub = stub(savereturn, 'resetUser')
const authenticateStub = stub(savereturn, 'authenticate')
const sendEmailStub = stub(savereturn, 'sendEmail')
const {client} = savereturn
const validateSetupMobileCodeStub = stub(client, 'validateSetupMobileCode')

const createRecordStub = stub(client, 'createRecord')

const ReturnSetupMobileValidateController = proxyquire('./return.setup.mobile.validate.controller', {
  '../../../savereturn': savereturn
})

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

  const instance = await ReturnSetupMobileValidateController.preUpdateContents({}, userData)
  t.equal(instance.redirect, 'page.start', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user attempts to verify a mobile for save and return but does not enter the verification code', async t => {
  resetStubs()
  getUserDataPropertyStub.callsFake(prop => '')

  await ReturnSetupMobileValidateController.postValidation({}, userData)
  t.ok(validateSetupMobileCodeStub.notCalled, 'it should not try to validate the mobile code')
  t.end()
})

test('When a user verifies their email token', async t => {
  resetStubs()

  const instance = await ReturnSetupMobileValidateController.postValidation({}, userData)

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

  t.equal(instance.redirect, 'return.setup.success', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user tries to verify a mobile token that is not valid (expired, used, superseded etc)', async t => {
  resetStubs()
  const error = new Error()
  validateSetupMobileCodeStub.callsFake(() => {
    throw error
  })
  await ReturnSetupMobileValidateController.postValidation({}, userData)
  t.ok(handleValidationErrorStub.calledOnce, 'it should yield to the error handler')
  t.deepEqual(handleValidationErrorStub.getCall(0).args, [error, 'return.setup.mobile'], 'it should call handleValidationError with the expected args')

  t.end()
})

test('When a user tries to verify an email token that is technically invalid', async t => {
  resetStubs()
  const error = new Error('code.invalid')
  validateSetupMobileCodeStub.callsFake(() => {
    throw error
  })
  await ReturnSetupMobileValidateController.postValidation({}, userData)
  t.ok(handleValidationErrorStub.notCalled, 'it should not yield to the error handler')

  t.end()
})
