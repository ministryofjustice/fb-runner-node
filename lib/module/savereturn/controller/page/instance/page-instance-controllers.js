
const returnEmail = require('./return.setup.email/return.setup.email.controller')
const returnEmailToken = require('./return.setup.email.token/return.setup.email.token.controller')
const returnStart = require('./return.start/return.start.controller')
const returnMagiclink = require('./return.authentication.magiclink/return.authentication.magiclink.controller')

module.exports = {
  'return.setup.email': returnEmail,
  'return.setup.email.token': returnEmailToken,
  'return.start': returnStart,
  'return.authentication.magiclink': returnMagiclink
}
