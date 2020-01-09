require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

class MockAnyOfController {}

const CheckboxesController = proxyquire('.', {
  '~/fb-runner-node/controller/component/common/any-of': MockAnyOfController
})

test('extends `AnyOfController` ', (t) => {
  const checkboxesController = new CheckboxesController()

  t.ok(checkboxesController instanceof MockAnyOfController, 'is an instanceof `AnyOfController`')

  t.end()
})
