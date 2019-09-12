const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const getComponentCompositeStub = stub()

const skipControlValidationStub = stub()
const skipControlProcessingStub = stub()
const processControlCompositeStub = stub()
const processControlStandardStub = stub()
const updateControlValueStub = stub()
const updateControlDisplayValueStub = stub()

const processControl = proxyquire('./process-control', {
  '../../controller/component/get-composite': getComponentCompositeStub,
  './skip-control-validation': skipControlValidationStub,
  './skip-control-processing': skipControlProcessingStub,
  './process-control-composite': processControlCompositeStub,
  './process-control-standard': processControlStandardStub,
  './update-control-value': updateControlValueStub,
  './update-control-display-value': updateControlDisplayValueStub
})

const resetStubs = () => {
  getComponentCompositeStub.resetHistory()
  skipControlValidationStub.resetHistory()
  skipControlProcessingStub.resetHistory()
  skipControlProcessingStub.returns()
  processControlCompositeStub.resetHistory()
  processControlStandardStub.resetHistory()
  updateControlValueStub.resetHistory()
  updateControlDisplayValueStub.resetHistory()
}

const pageInstance = {}
const nameInstance = {
  name: 'foo'
}
const userData = {}

test('When processing a standard control', t => {
  resetStubs()
  processControlStandardStub.returns('bar')

  processControl(pageInstance, userData, nameInstance)

  t.ok(skipControlValidationStub.calledOnce, 'it should check whether to skip validating the control')
  t.deepEqual(skipControlValidationStub.args[0], [pageInstance, userData, nameInstance], 'it should call skipControlValidation with the expected args')

  t.ok(skipControlProcessingStub.calledOnce, 'it should check whether to skip processing the control')
  t.deepEqual(skipControlProcessingStub.args[0], [pageInstance, userData, nameInstance], 'it should call skipControlProcessing with the expected args')

  const options = {
    controlName: 'foo',
    composite: undefined
  }

  t.ok(processControlCompositeStub.notCalled, 'it should not use the composite method to process the control')
  t.ok(processControlStandardStub.calledOnce, 'it should process the control with the standard method')
  t.deepEqual(processControlStandardStub.args[0], [pageInstance, userData, nameInstance, options], 'it should call processControlStandard with the expected args')

  const optionsWithNameValue = Object.assign({nameValue: 'bar'}, options)

  t.ok(updateControlValueStub.calledOnce, 'it should update the control’s value')
  t.deepEqual(updateControlValueStub.args[0], [pageInstance, userData, nameInstance, optionsWithNameValue], 'it should call updateControlValue with the expected args')

  t.ok(updateControlDisplayValueStub.calledOnce, 'it should update the control’s display value')
  t.deepEqual(updateControlDisplayValueStub.args[0], [pageInstance, userData, nameInstance, optionsWithNameValue], 'it should call updateControlDisplayValue with the expected args')

  t.end()
})

test('When processing a composite control', t => {
  resetStubs()
  getComponentCompositeStub.returns(['a', 'b'])
  processControlCompositeStub.returns('bar')

  processControl(pageInstance, userData, nameInstance)

  t.ok(skipControlValidationStub.calledOnce, 'it should check whether to skip validating the control')
  t.deepEqual(skipControlValidationStub.args[0], [pageInstance, userData, nameInstance], 'it should call skipControlValidation with the expected args')

  t.ok(skipControlProcessingStub.calledOnce, 'it should check whether to skip processing the control')
  t.deepEqual(skipControlProcessingStub.args[0], [pageInstance, userData, nameInstance], 'it should call skipControlProcessing with the expected args')

  const options = {
    controlName: 'foo',
    composite: ['a', 'b']
  }

  t.ok(processControlStandardStub.notCalled, 'it should not use the composite method to process the control')
  t.ok(processControlCompositeStub.calledOnce, 'it should process the control with the standard method')
  t.deepEqual(processControlCompositeStub.args[0], [pageInstance, userData, nameInstance, options], 'it should call processControlStandard with the expected args')

  const optionsWithNameValue = Object.assign({nameValue: 'bar'}, options)

  t.ok(updateControlValueStub.calledOnce, 'it should update the control’s value')
  t.deepEqual(updateControlValueStub.args[0], [pageInstance, userData, nameInstance, optionsWithNameValue], 'it should call updateControlValue with the expected args')

  t.ok(updateControlDisplayValueStub.calledOnce, 'it should update the control’s display value')
  t.deepEqual(updateControlDisplayValueStub.args[0], [pageInstance, userData, nameInstance, optionsWithNameValue], 'it should call updateControlDisplayValue with the expected args')

  t.end()
})

test('When a control should not be processed', t => {
  resetStubs()
  skipControlProcessingStub.returns(true)

  processControl(pageInstance, userData, nameInstance)

  t.ok(processControlStandardStub.notCalled, 'it should not use the composite method to process the control')
  t.ok(processControlCompositeStub.notCalled, 'it should not process the control with the standard method')
  t.ok(updateControlValueStub.notCalled, 'it should not update the control’s value')
  t.ok(updateControlDisplayValueStub.notCalled, 'it should not update the control’s display value')

  t.end()
})

test('When a control should have its validation skipped', t => {
  resetStubs()
  skipControlValidationStub.callsFake((pageInstance, userData, nameInstance) => {
    nameInstance.$skipValidation = true
  })

  const skipValidationInstance = {
    name: 'foo'
  }

  processControl(pageInstance, userData, skipValidationInstance)

  t.ok(processControlStandardStub.notCalled, 'it should not use the composite method to process the control')
  t.ok(processControlCompositeStub.notCalled, 'it should not process the control with the standard method')
  t.ok(updateControlValueStub.calledOnce, 'it should update the control’s value')
  t.ok(updateControlDisplayValueStub.calledOnce, 'it should update the control’s display value')

  t.end()
})
