require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

class MockOneOfController {}

const SelectController = proxyquire('.', {
  '~/fb-runner-node/controller/component/common/one-of': MockOneOfController
})

test('extends `OneOfController` ', (t) => {
  const selectController = new SelectController()

  t.ok(selectController instanceof MockOneOfController, 'is an instanceof `OneOfController`')

  t.end()
})
