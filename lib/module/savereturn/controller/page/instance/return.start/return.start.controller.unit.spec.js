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
const createMagiclinkStub = stub(client, 'createMagiclink')
createMagiclinkStub.returns('token')

const signinStartController = proxyquire('./return.start.controller', {
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
  createMagiclinkStub.resetHistory()
}

test('When a user provides an email to sign in with', async t => {
  resetStubs()

  await signinStartController.postValidation({}, userData)

  t.ok(createMagiclinkStub.calledOnce, 'it should request the creation of a magic link')
  t.deepEqual(createMagiclinkStub.getCall(0).args, ['email@example.com', 100, loggerStub], 'it should call createMagiclink with the expected args')

  t.ok(sendEmailStub.calledOnce, 'it should send an email containing the magiclink')
  t.deepEqual(sendEmailStub.getCall(0).args, ['email.return.signin.email', userData, {token: 'token'}], 'it should call sendEmail with the expected args')

  t.end()
})

test('When a request to create a magic link fails to return a token', async t => {
  resetStubs()
  createMagiclinkStub.callsFake(() => {
    throw new Error('No token')
  })

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
    const error = new Error('email.missing')
    error.code = 401
    throw error
  })

  const instance = await signinStartController.postValidation({}, userData)
  t.deepEqual(instance, {}, 'it should return the page instance as normal')
  t.ok(sendEmailStub.notCalled, 'it should not send an email containing the magiclink')

  t.end()
})
