require('@ministryofjustice/module-alias/register-module')(module)

const { test } = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const getUserParamStub = sinon.stub().callsFake(prop => {
  if (prop === 'magiclink') {
    return 'magiclink'
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
const handleValidationErrorStub = sinon.stub(savereturn, 'handleValidationError')
const resetUserStub = sinon.stub(savereturn, 'resetUser')
const authenticateStub = sinon.stub(savereturn, 'authenticate')
const sendEmailStub = sinon.stub(savereturn, 'sendEmail')
const sendSMSStub = sinon.stub(savereturn, 'sendSMS')
const getConfigStub = sinon.stub(savereturn, 'getConfig').callsFake(type => {
  if (type === 'smsCodeDuration') {
    return 45
  }
})
const validateAuthenticationMagiclinkStub = sinon.stub(client, 'validateAuthenticationMagiclink')
const createSigninMobileCodeStub = sinon.stub(client, 'createSigninMobileCode').returns('code')

class mockCommonController {}

const SigninMagiclinkController = proxyquire('./return.signin.magiclink.controller', {
  '~/fb-runner-node/module/savereturn/controller/page/common': mockCommonController,
  '~/fb-runner-node/module/savereturn/controller/savereturn': savereturn
})

const userData = {
  getUserParam: getUserParamStub,
  logger: loggerStub
}

const userDetailsWith2fa = {
  other_details: true,
  mobile: 'mobile',
  email: 'email'
}

const userDetailsWithout2fa = {
  other_details: true,
  email: 'email'
}

const resetStubs = () => {
  getUserParamStub.resetHistory()
  handleValidationErrorStub.resetHistory()
  resetUserStub.resetHistory()
  authenticateStub.resetHistory()
  sendEmailStub.resetHistory()
  sendSMSStub.resetHistory()
  getConfigStub.resetHistory()
  validateAuthenticationMagiclinkStub.resetHistory()
  validateAuthenticationMagiclinkStub.returns(userDetailsWith2fa)
  createSigninMobileCodeStub.resetHistory()
}

test('When a user with 2fa enabled visits a valid magic link', async t => {
  resetStubs()

  const signinMagiclinkController = new SigninMagiclinkController()

  const pageInstance = await signinMagiclinkController.preUpdateContents({}, userData)

  t.ok(validateAuthenticationMagiclinkStub.calledOnce, 'it should validate the magic link')
  t.same(validateAuthenticationMagiclinkStub.getCall(0).args, ['magiclink', loggerStub], 'it should call validateAuthenticationMagiclink with the expected args')

  t.ok(resetUserStub.calledOnce, 'it should reset the user')
  t.same(resetUserStub.getCall(0).args, [userData, userDetailsWith2fa], 'it should call resetUser with the expected args')

  t.ok(createSigninMobileCodeStub.calledOnce, 'it should send an sms containing the confirmation code')
  t.same(createSigninMobileCodeStub.getCall(0).args, ['email', 45, loggerStub], 'it should call createSigninMobileCode with the expected args')

  t.ok(sendEmailStub.notCalled, 'it should not send an email stating that the user has signed in')

  t.equal(pageInstance.redirect, 'return.signin.mobile.validate', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user without 2fa enabled visits a valid magic link', async t => {
  resetStubs()

  validateAuthenticationMagiclinkStub.returns(userDetailsWithout2fa)

  const signinMagiclinkController = new SigninMagiclinkController()

  const pageInstance = await signinMagiclinkController.preUpdateContents({}, userData)

  t.ok(validateAuthenticationMagiclinkStub.calledOnce, 'it should validate the magic link')
  t.same(validateAuthenticationMagiclinkStub.getCall(0).args, ['magiclink', loggerStub], 'it should call validateAuthenticationMagiclink with the expected args')

  t.ok(resetUserStub.calledOnce, 'it should reset the user')
  t.same(resetUserStub.getCall(0).args, [userData, userDetailsWithout2fa], 'it should call resetUser with the expected args')

  t.ok(createSigninMobileCodeStub.notCalled, 'it should not send an sms containing a confirmation code')

  t.ok(sendEmailStub.calledOnce, 'it should send an email stating that the user has signed in')
  t.same(sendEmailStub.getCall(0).args, ['email.return.signin.success', userData], 'it should call sendEmail with the expected args')

  t.equal(pageInstance.redirect, 'return.authenticated', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user visits a valid magic link that is not valid', async t => {
  resetStubs()

  const error = new Error('Mock Error')
  validateAuthenticationMagiclinkStub.callsFake(() => {
    throw error
  })

  const signinMagiclinkController = new SigninMagiclinkController()

  await signinMagiclinkController.preUpdateContents({}, userData)

  t.ok(handleValidationErrorStub.calledOnce, 'it should yield to the error handler')
  t.same(handleValidationErrorStub.getCall(0).args, [error, 'return.signin.magiclink'], 'it should call handleValidationError with the expected args')

  t.end()
})
