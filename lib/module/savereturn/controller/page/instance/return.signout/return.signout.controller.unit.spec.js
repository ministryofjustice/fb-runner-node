const test = require('tape')
const {stub} = require('sinon')

const unsetUserDataPropertyStub = stub()
const clearSessionStub = stub()
const userData = {
  unsetUserDataProperty: unsetUserDataPropertyStub,
  clearSession: clearSessionStub
}

const ReturnSignoutController = require('./return.signout.controller')

const resetStubs = () => {
  clearSessionStub.resetHistory()
  unsetUserDataPropertyStub.resetHistory()
}

test('When a user provides an email to sign in with', async t => {
  resetStubs()

  await ReturnSignoutController.preUpdateContents({}, userData)

  t.ok(clearSessionStub.calledOnce, 'it should clear the user session')

  t.ok(unsetUserDataPropertyStub.calledTwice, 'it should unset the required values')
  t.deepEqual(unsetUserDataPropertyStub.getCall(0).args, ['authenticated'], 'it should unset the authenticated value')
  t.deepEqual(unsetUserDataPropertyStub.getCall(1).args, ['email'], 'it should unset the email value')

  t.end()
})
