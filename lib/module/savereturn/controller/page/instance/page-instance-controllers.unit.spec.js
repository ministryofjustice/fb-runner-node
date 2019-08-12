const test = require('tape')
const pageInstanceControllers = require('./page-instance-controllers')

test('When requiring page-instance-controllers', t => {
  const controllers = [
    'return.setup.email',
    'return.setup.email.token',
    'return.setup.mobile',
    'return.setup.mobile.sent',
    'return.start',
    'return.signin.magiclink',
    'return.signin.code.sent',
    'return.signout'
  ]

  t.deepEqual(Object.keys(pageInstanceControllers).sort(), controllers.sort(), 'it should export the expected controllers')

  t.end()
})
