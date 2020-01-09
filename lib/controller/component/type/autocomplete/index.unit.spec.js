require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

class MockOneOfController {}

const AutocompleteController = proxyquire('.', {
  '~/fb-runner-node/controller/component/common/one-of': MockOneOfController
})

test('extends `OneOfController` ', (t) => {
  const autocompleteController = new AutocompleteController()

  t.ok(autocompleteController instanceof MockOneOfController, 'is an instanceof `OneOfController`')

  t.end()
})
