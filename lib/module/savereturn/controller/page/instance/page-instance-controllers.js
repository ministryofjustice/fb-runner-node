
const setupEmail = require('./return.setup.email/return.setup.email.controller')
const setupEmailValidate = require('./return.setup.email.token/return.setup.email.token.controller')
const returnMobile = require('./return.setup.mobile/return.setup.mobile.controller')
const setupMobileValidate = require('./return.setup.mobile.sent/return.setup.mobile.sent.controller')
const returnStart = require('./return.start/return.start.controller')
const signinMagiclink = require('./return.signin.magiclink/return.signin.magiclink.controller')
const signinCodeValidate = require('./return.signin.code.sent/return.signin.code.sent.controller')
const signout = require('./return.signout/return.signout.controller')

module.exports = {
  'return.setup.email': setupEmail,
  'return.setup.email.token': setupEmailValidate,
  'return.setup.mobile': returnMobile,
  'return.setup.mobile.sent': setupMobileValidate,
  'return.start': returnStart,
  'return.signin.magiclink': signinMagiclink,
  'return.signin.code.sent': signinCodeValidate,
  'return.signout': signout
}
