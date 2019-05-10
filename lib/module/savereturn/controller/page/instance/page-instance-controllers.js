
const returnEmail = require('./return.setup.email/return.setup.email.controller')
const returnEmailToken = require('./return.setup.email.token/return.setup.email.token.controller')

module.exports = {
  'return.setup.email': returnEmail,
  'return.setup.email.token': returnEmailToken
}
