require('@ministryofjustice/module-alias/register-module')(module)

const { test } = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const getUserDataPropertyStub = sinon.stub()
const unsetUserDataPropertyStub = sinon.stub()

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
const handleValidationErrorStub = sinon.stub(savereturn, 'handleValidationError')
const resetUserStub = sinon.stub(savereturn, 'resetUser')
const authenticateStub = sinon.stub(savereturn, 'authenticate')
const sendEmailStub = sinon.stub(savereturn, 'sendEmail')
const validateSigninMobileCodeStub = sinon.stub(client, 'validateSigninMobileCode')
const createRecordStub = sinon.stub(client, 'createRecord')

class mockCommonController {}

const SigninMobileValidateController = proxyquire('./return.signin.mobile.validate.controller', {
  '~/fb-runner-node/module/savereturn/controller/page/common': mockCommonController,
  '~/fb-runner-node/module/savereturn/controller/savereturn': savereturn
})

const userData = {
  getUserDataProperty: getUserDataPropertyStub,
  unsetUserDataProperty: unsetUserDataPropertyStub,
  logger: loggerStub
}

const userDetails = {
  userId: 'userId',
  userToken: 'userToken',
  email: 'email'
}

const resetStubs = () => {
  unsetUserDataPropertyStub.resetHistory()
  getUserDataPropertyStub.resetHistory()
  getUserDataPropertyStub.callsFake(prop => prop)
  handleValidationErrorStub.resetHistory()
  resetUserStub.resetHistory()
  authenticateStub.resetHistory()
  sendEmailStub.resetHistory()
  validateSigninMobileCodeStub.resetHistory()
  validateSigninMobileCodeStub.returns(userDetails)
  createRecordStub.resetHistory()
}

test('When a user attempts to enter a sign in mobile confirmation code without having first used a magic link', async t => {
  resetStubs()

  getUserDataPropertyStub.callsFake(prop => {
    if (prop === 'email') {
      return
    }
    return prop
  })

  const signinMobileValidateController = new SigninMobileValidateController()

  const instance = await signinMobileValidateController.preUpdateContents({}, userData)
  t.equal(instance.redirect, 'return.start', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user attempts to enter a sign in mobile confirmation code without having registered a mobile', async t => {
  resetStubs()

  getUserDataPropertyStub.callsFake(prop => {
    if (prop === 'mobile') {
      return
    }
    return prop
  })

  const signinMobileValidateController = new SigninMobileValidateController()

  const instance = await signinMobileValidateController.preUpdateContents({}, userData)

  t.equal(instance.redirect, 'return.start', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user attempts to verify a mobile for save and return but does not enter the verification code', async t => {
  resetStubs()

  getUserDataPropertyStub.callsFake(prop => {
    if (prop === 'signin_code') {
      return
    }
    return prop
  })

  const signinMobileValidateController = new SigninMobileValidateController()

  await signinMobileValidateController.postValidation({}, userData)

  t.ok(validateSigninMobileCodeStub.notCalled, 'it should not try to validate the mobile code')
  t.end()
})

test('When a user verifies their mobile sign in code', async t => {
  resetStubs()

  const signinMobileValidateController = new SigninMobileValidateController()

  const instance = await signinMobileValidateController.postValidation({}, userData)

  t.ok(validateSigninMobileCodeStub.calledOnce, 'it should validate the mobile code')
  t.deepEqual(validateSigninMobileCodeStub.getCall(0).args, ['signin_code', 'email', loggerStub], 'it should call validateSigninMobileCode with the expected args')

  t.deepEqual(unsetUserDataPropertyStub.getCall(0).args, ['signin_code'], 'it should unset the signin_code value')

  t.ok(resetUserStub.calledOnce, 'it should reset the user')
  t.deepEqual(resetUserStub.getCall(0).args, [userData, userDetails], 'it should call resetUser with the expected args')

  t.ok(authenticateStub.calledOnce, 'it should authenticate the user')
  t.deepEqual(authenticateStub.getCall(0).args, [userData, 'signin-code'], 'it should call authenticate with the expected args')

  t.ok(sendEmailStub.calledOnce, 'it should send an email stating that the user has set up save and return successfully')
  t.deepEqual(sendEmailStub.getCall(0).args, ['email.return.signin.success', userData], 'it should call sendEmail with the expected args')

  t.equal(instance.redirect, 'return.authenticated', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user tries to verify a mobile sign in code is not valid (expired, used, superseded etc)', async t => {
  resetStubs()

  const error = new Error('Mock Error')
  validateSigninMobileCodeStub.callsFake(() => {
    throw error
  })

  const signinMobileValidateController = new SigninMobileValidateController()

  await signinMobileValidateController.postValidation({}, userData)

  t.ok(handleValidationErrorStub.calledOnce, 'it should yield to the error handler')
  t.deepEqual(handleValidationErrorStub.getCall(0).args, [error, 'return.signin.mobile'], 'it should call handleValidationError with the expected args')

  t.end()
})

test('When a user tries to verify a mobile sign in code that invalid (throwing a `code.invalid` error)', async t => {
  resetStubs()

  const error = new Error('code.invalid')
  validateSigninMobileCodeStub.callsFake(() => {
    throw error
  })

  const signinMobileValidateController = new SigninMobileValidateController()

  await signinMobileValidateController.postValidation({}, userData)

  t.ok(handleValidationErrorStub.notCalled, 'it should not yield to the error handler')

  t.end()
})
