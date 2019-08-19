const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const getUserParamStub = stub()
getUserParamStub.callsFake(prop => {
  if (prop === 'magiclink') {
    return 'magiclink'
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
const sendSMSStub = stub(savereturn, 'sendSMS')
const getConfigStub = stub(savereturn, 'getConfig')
const {client} = savereturn
const validateAuthenticationMagiclinkStub = stub(client, 'validateAuthenticationMagiclink')

const createSigninMobileCodeStub = stub(client, 'createSigninMobileCode')
createSigninMobileCodeStub.returns('code')

const ReturnAuthenticationMagiclinkController = proxyquire('./return.signin.magiclink.controller', {
  '../../../savereturn': savereturn
})

const userDetails2fa = {
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
  getConfigStub.callsFake(type => {
    if (type === 'smsCodeDuration') {
      return 45
    }
  })
  validateAuthenticationMagiclinkStub.resetHistory()
  validateAuthenticationMagiclinkStub.returns(userDetails2fa)
  createSigninMobileCodeStub.resetHistory()
}

test('When a user with 2fa enabled visits a valid magic link', async t => {
  resetStubs()

  const instance = await ReturnAuthenticationMagiclinkController.preUpdateContents({}, userData)

  t.ok(validateAuthenticationMagiclinkStub.calledOnce, 'it should validate the magic link')
  t.deepEqual(validateAuthenticationMagiclinkStub.getCall(0).args, ['magiclink', loggerStub], 'it should call validateAuthenticationMagiclink with the expected args')

  t.ok(resetUserStub.calledOnce, 'it should reset the user')
  t.deepEqual(resetUserStub.getCall(0).args, [userData, userDetails2fa], 'it should call resetUser with the expected args')

  t.ok(createSigninMobileCodeStub.calledOnce, 'it should send an sms containing the confirmation code')
  t.deepEqual(createSigninMobileCodeStub.getCall(0).args, ['email', 45, loggerStub], 'it should call createSigninMobileCode with the expected args')

  t.ok(sendEmailStub.notCalled, 'it should not send an email stating that the user has signed in')

  t.equal(instance.redirect, 'return.signin.mobile.validate', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user without 2fa enabled visits a valid magic link', async t => {
  resetStubs()
  validateAuthenticationMagiclinkStub.returns(userDetailsWithout2fa)

  const instance = await ReturnAuthenticationMagiclinkController.preUpdateContents({}, userData)

  t.ok(validateAuthenticationMagiclinkStub.calledOnce, 'it should validate the magic link')
  t.deepEqual(validateAuthenticationMagiclinkStub.getCall(0).args, ['magiclink', loggerStub], 'it should call validateAuthenticationMagiclink with the expected args')

  t.ok(resetUserStub.calledOnce, 'it should reset the user')
  t.deepEqual(resetUserStub.getCall(0).args, [userData, userDetailsWithout2fa], 'it should call resetUser with the expected args')

  t.ok(createSigninMobileCodeStub.notCalled, 'it should not send an sms containing a confirmation code')

  t.ok(sendEmailStub.calledOnce, 'it should send an email stating that the user has signed in')
  t.deepEqual(sendEmailStub.getCall(0).args, ['email.return.signin.success', userData], 'it should call sendEmail with the expected args')

  t.equal(instance.redirect, 'return.authenticated', 'it should update the page instance redirect property with the expected value')

  t.end()
})

test('When a user visits a valid magic link that is not valid', async t => {
  resetStubs()
  const error = new Error()
  validateAuthenticationMagiclinkStub.callsFake(() => {
    throw error
  })
  await ReturnAuthenticationMagiclinkController.preUpdateContents({}, userData)
  t.ok(handleValidationErrorStub.calledOnce, 'it should yield to the error handler')
  t.deepEqual(handleValidationErrorStub.getCall(0).args, [error, 'return.signin.magiclink'], 'it should call handleValidationError with the expected args')

  t.end()
})
