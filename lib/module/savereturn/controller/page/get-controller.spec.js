require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

class MockSetupEmailController {}
class MockSetupEmailTokenController {}
class MockSetupMobileController {}
class MockSetupMobileValidateController {}
class MockStartController {}
class MockSigninMagiclinkController {}
class MockSigninMobileValidateController {}
class MockSignoutController {}

const {
  hasController,
  getController
} = proxyquire('./get-controller', {
  './type/return.setup.email/return.setup.email.controller': MockSetupEmailController,
  './type/return.setup.email.token/return.setup.email.token.controller': MockSetupEmailTokenController,
  './type/return.setup.mobile/return.setup.mobile.controller': MockSetupMobileController,
  './type/return.setup.mobile.validate/return.setup.mobile.validate.controller': MockSetupMobileValidateController,
  './type/return.start/return.start.controller': MockStartController,
  './type/return.signin.magiclink/return.signin.magiclink.controller': MockSigninMagiclinkController,
  './type/return.signin.mobile.validate/return.signin.mobile.validate.controller': MockSigninMobileValidateController,
  './type/return.signout/return.signout.controller': MockSignoutController
})

test('getting the return setup email controller', (t) => {
  t.ok(hasController('return.setup.email'))

  t.ok(getController('return.setup.email') instanceof MockSetupEmailController, 'is an instanceof `SetupEmailController`')

  t.end()
})

test('getting the return setup email token controller', (t) => {
  t.ok(hasController('return.setup.email.token'))

  t.ok(getController('return.setup.email.token') instanceof MockSetupEmailTokenController, 'is an instanceof `SetupEmailTokenController`')

  t.end()
})

test('getting the return setup mobile controller', (t) => {
  t.ok(hasController('return.setup.mobile'))

  t.ok(getController('return.setup.mobile') instanceof MockSetupMobileController, 'is an instanceof `SetupMobileController`')

  t.end()
})

test('getting the return setup mobile validate controller', (t) => {
  t.ok(hasController('return.setup.mobile.validate'))

  t.ok(getController('return.setup.mobile.validate') instanceof MockSetupMobileValidateController, 'is an instanceof `SetupMobileValidateController`')

  t.end()
})

test('getting the return start controller', (t) => {
  t.ok(hasController('return.start'))

  t.ok(getController('return.start') instanceof MockStartController, 'is an instanceof `StartController`')

  t.end()
})

test('getting the return signin magiclink controller', (t) => {
  t.ok(hasController('return.signin.magiclink'))

  t.ok(getController('return.signin.magiclink') instanceof MockSigninMagiclinkController, 'is an instanceof `SigninMagiclinkController`')

  t.end()
})

test('getting the return signin mobile validate controller', (t) => {
  t.ok(hasController('return.signin.mobile.validate'))

  t.ok(getController('return.signin.mobile.validate') instanceof MockSigninMobileValidateController, 'is an instanceof `SigninMobileValidateController`')

  t.end()
})

test('getting the return signout controller', (t) => {
  t.ok(hasController('return.signout'))

  t.ok(getController('return.signout') instanceof MockSignoutController, 'is an instanceof `SignoutController`')

  t.end()
})
