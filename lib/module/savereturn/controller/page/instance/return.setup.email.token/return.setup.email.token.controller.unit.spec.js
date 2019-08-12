const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const getUserParamStub = stub()
getUserParamStub.callsFake(prop => {
  if (prop === 'token') {
    return 'token'
  }
  if (prop === 'passphrase') {
    return 'passphrase'
  }
})

const loggerStub = stub()
const userData = {
  getUserParam: getUserParamStub,
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
const validateSetupEmailTokenStub = stub(client, 'validateSetupEmailToken')

const createRecordStub = stub(client, 'createRecord')

const ReturnEmailTokenController = proxyquire('./return.setup.email.token.controller', {
  '../../../savereturn': savereturn
})

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

  const instance = await ReturnEmailTokenController.preUpdateContents({}, userData)

  t.ok(validateSetupEmailTokenStub.calledOnce, 'it should validate the email token')
  t.deepEqual(validateSetupEmailTokenStub.getCall(0).args, ['token', 'passphrase', loggerStub], 'it should call validateSetupEmailToken with the expected args')

  t.ok(resetUserStub.calledOnce, 'it should reset the user')
  t.deepEqual(resetUserStub.getCall(0).args, [userData, userDetails], 'it should call resetUser with the expected args')

  t.ok(createRecordStub.calledOnce, 'it should create a save and return record for the user')
  t.deepEqual(createRecordStub.getCall(0).args, ['userId', 'userToken', 'email', undefined, loggerStub], 'it should call createRecord with the expected args')

  t.ok(authenticateStub.calledOnce, 'it should authenticate the user')
  t.deepEqual(authenticateStub.getCall(0).args, [userData, 'setup-email'], 'it should call authenticate with the expected args')

  t.ok(sendEmailStub.calledOnce, 'it should send an email stating that the user has set up save and return successfully')
  t.deepEqual(sendEmailStub.getCall(0).args, ['email.return.setup.email.verified', userData], 'it should call sendEmail with the expected args')

  t.equal(instance.redirect, 'return.setup.success', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user tries to verify an email token that is not valid', async t => {
  resetStubs()
  const err = new Error('Boom')
  validateSetupEmailTokenStub.callsFake(() => {
    throw err
  })
  await ReturnEmailTokenController.preUpdateContents({}, userData)
  t.ok(handleValidationErrorStub.calledOnce, 'it should yield to the error handler')
  t.deepEqual(handleValidationErrorStub.getCall(0).args, [err, 'return.setup.email'], 'it should call handleValidationError with the expected args')

  t.end()
})
