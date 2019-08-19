
const setupEmail = require('./return.setup.email/return.setup.email.controller')
const setupEmailValidate = require('./return.setup.email.token/return.setup.email.token.controller')
const returnMobile = require('./return.setup.mobile/return.setup.mobile.controller')
const setupMobileValidate = require('./return.setup.mobile.validate/return.setup.mobile.validate.controller')
const returnStart = require('./return.start/return.start.controller')
const signinMagiclink = require('./return.signin.magiclink/return.signin.magiclink.controller')
const signinMobileValidate = require('./return.signin.mobile.validate/return.signin.mobile.validate.controller')
const signout = require('./return.signout/return.signout.controller')

module.exports = {
  'return.setup.email': setupEmail,
  'return.setup.email.token': setupEmailValidate,
  'return.setup.mobile': returnMobile,
  'return.setup.mobile.validate': setupMobileValidate,
  'return.start': returnStart,
  'return.signin.magiclink': signinMagiclink,
  'return.signin.mobile.validate': signinMobileValidate,
  'return.signout': signout
}
