const test = require('tape')
const {stub} = require('sinon')

const skipControlValidation = require('./skip-control-validation')

const evaluateStub = stub()

const userData = {
  evaluate: evaluateStub
}

const resetStubs = () => {
  evaluateStub.resetHistory()
}

const pageInstance = {}

test('When an instance is not shown conditionally', t => {
  resetStubs()

  const nameInstance = {}

  skipControlValidation(pageInstance, userData, nameInstance)

  t.equal(nameInstance.$skipValidation, undefined, 'it should not set the $skipValidation property')

  t.end()
})

test('When an instance is shown conditionally', t => {
  resetStubs()

  const nameInstance = {
    $conditionalShow: {}
  }

  skipControlValidation(pageInstance, userData, nameInstance)
  t.ok(evaluateStub.calledOnce, 'it should evaluate the condition for showing the component')
  t.deepEqual(evaluateStub.args[0], [
    nameInstance.$conditionalShow,
    {
      page: pageInstance,
      instance: nameInstance
    }
  ], 'it should call the evaluate method with the expected args')

  t.end()
})

test('When an instance is shown conditionally and the condition is not met', t => {
  resetStubs()

  const nameInstance = {
    $conditionalShow: {}
  }

  skipControlValidation(pageInstance, userData, nameInstance)

  t.equal(nameInstance.$skipValidation, true, 'it should set the $skipValidation property')

  t.end()
})

test('When an instance is shown conditionally and the condition is met', t => {
  resetStubs()
  evaluateStub.returns(true)

  const nameInstance = {
    $conditionalShow: {}
  }

  skipControlValidation(pageInstance, userData, nameInstance)

  t.equal(nameInstance.$skipValidation, undefined, 'it should not set the $skipValidation property')

  t.end()
})
