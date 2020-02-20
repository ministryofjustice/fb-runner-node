require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
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
  'SUBMITTER_URL'
]
const savereturn = require('~/fb-runner-node/module/savereturn/controller/savereturn')

envVars.forEach(envVar => {
  process.env[envVar] = 'test'
})

envVars.forEach(envVar => {
  delete process.env[envVar]
})

const { client } = savereturn
const sendEmailStub = sinon.stub(savereturn, 'sendEmail')
const getConfigStub = sinon.stub(savereturn, 'getConfig').callsFake(type => {
  if (type === 'emailTokenDuration') {
    return 100
  }
})
const createMagiclinkStub = sinon.stub(client, 'createMagiclink')
createMagiclinkStub.returns('token')

const SigninStartController = proxyquire('./return.start.controller', {
  '~/fb-runner-node/module/savereturn/controller/savereturn': savereturn
})

const userData = {
  getUserDataProperty: getUserDataPropertyStub,
  logger: loggerStub
}

const resetStubs = () => {
  sendEmailStub.resetHistory()
  getConfigStub.resetHistory()
  createMagiclinkStub.resetHistory()
}

test('When a user provides an email to sign in with', async t => {
  resetStubs()

  const signinStartController = new SigninStartController()

  await signinStartController.postValidation({}, userData)

  t.ok(createMagiclinkStub.calledOnce, 'it should request the creation of a magic link')
  t.deepEqual(createMagiclinkStub.getCall(0).args, ['email@example.com', 100, loggerStub], 'it should call createMagiclink with the expected args')

  t.ok(sendEmailStub.calledOnce, 'it should send an email containing the magiclink')
  t.deepEqual(sendEmailStub.getCall(0).args, ['email.return.signin.email', userData, { token: 'token' }], 'it should call sendEmail with the expected args')

  t.end()
})

test('When a request to create a magic link fails to return a token', async t => {
  resetStubs()

  createMagiclinkStub.callsFake(() => {
    throw new Error('No token')
  })

  const signinStartController = new SigninStartController()

  try {
    t.throws(await signinStartController.postValidation({}, userData))
  } catch (e) {
    t.ok(sendEmailStub.notCalled, 'it should not send an email containing the magiclink')
  }

  t.end()
})

test('When a request to create a magic link is for an unrecognised email address', async t => {
  resetStubs()
  createMagiclinkStub.callsFake(() => {
    const error = new Error('No email')
    error.code = 'ENOENCRYPTVALUE'
    throw error
  })

  const signinStartController = new SigninStartController()

  const pageInstance = await signinStartController.postValidation({}, userData)

  t.deepEqual(pageInstance, {}, 'it should return the page instance as normal')
  t.ok(sendEmailStub.notCalled, 'it should not send an email containing the magiclink')

  t.end()
})
