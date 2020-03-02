require('@ministryofjustice/module-alias/register-module')(module)

const { test } = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const unsetUserDataPropertyStub = sinon.stub()
const clearSessionStub = sinon.stub()

const savereturn = require('~/fb-runner-node/module/savereturn/controller/savereturn')

class mockCommonController {}

const SignoutController = proxyquire('./return.signout.controller', {
  '~/fb-runner-node/module/savereturn/controller/page/common': mockCommonController,
  '~/fb-runner-node/module/savereturn/controller/savereturn': savereturn
})

const userData = {
  unsetUserDataProperty: unsetUserDataPropertyStub,
  clearSession: clearSessionStub
}

const resetStubs = () => {
  clearSessionStub.resetHistory()
  unsetUserDataPropertyStub.resetHistory()
}

test('When a user provides an email to sign in with', async t => {
  resetStubs()

  const signoutController = new SignoutController()

  await signoutController.preUpdateContents({}, userData)

  t.ok(clearSessionStub.calledOnce, 'it should clear the user session')

  t.ok(unsetUserDataPropertyStub.calledTwice, 'it should unset the required values')
  t.deepEqual(unsetUserDataPropertyStub.getCall(0).args, ['authenticated'], 'it should unset the authenticated value')
  t.deepEqual(unsetUserDataPropertyStub.getCall(1).args, ['email'], 'it should unset the email value')

  t.end()
})
