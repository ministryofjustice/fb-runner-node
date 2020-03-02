
const SetupEmailController = require('./type/return.setup.email/return.setup.email.controller')
const SetupEmailTokenController = require('./type/return.setup.email.token/return.setup.email.token.controller')
const SetupMobileController = require('./type/return.setup.mobile/return.setup.mobile.controller')
const SetupMobileValidateController = require('./type/return.setup.mobile.validate/return.setup.mobile.validate.controller')
const ReturnStartController = require('./type/return.start/return.start.controller')
const SigninMagiclinkController = require('./type/return.signin.magiclink/return.signin.magiclink.controller')
const SigninMobileValidateController = require('./type/return.signin.mobile.validate/return.signin.mobile.validate.controller')
const SignoutController = require('./type/return.signout/return.signout.controller')

const map = new Map()

map.set('return.setup.email', new SetupEmailController())
map.set('return.setup.email.token', new SetupEmailTokenController())
map.set('return.setup.mobile', new SetupMobileController())
map.set('return.setup.mobile.validate', new SetupMobileValidateController())
map.set('return.start', new ReturnStartController())
map.set('return.signin.magiclink', new SigninMagiclinkController())
map.set('return.signin.mobile.validate', new SigninMobileValidateController())
map.set('return.signout', new SignoutController())

function hasController (route) {
  return map.has(route)
}

function getController (route) {
  return map.get(route)
}

module.exports = {
  hasController,
  getController
}
