
const returnEmailCheck = require('./return.setup.email.check/return.setup.email.check.controller')
const returnEmailToken = require('./return.setup.email.token/return.setup.email.token.controller')

module.exports = {
  'return.setup.email.check': returnEmailCheck,
  'return.setup.email.token': returnEmailToken
}
