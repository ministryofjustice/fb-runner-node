require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

class MockOneOfController {}

const RadiosController = proxyquire('.', {
  '~/fb-runner-node/controller/component/common/one-of': MockOneOfController
})

test('extends `OneOfController` ', (t) => {
  const radiosController = new RadiosController()

  t.ok(radiosController instanceof MockOneOfController, 'is an instanceof `OneOfController`')

  t.end()
})
