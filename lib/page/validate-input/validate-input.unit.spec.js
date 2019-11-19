require('module-alias/register')

const rewiremock = require('rewiremock/node')
const jp = require('jsonpath')
const test = require('tape')
const {stub} = require('sinon')

const {setServiceInstances} = require('~/fb-runner-node/service-data/service-data')
const {deepClone, FBLogger} = require('@ministryofjustice/fb-utils-node')
const {getUserDataMethods} = require('~/fb-runner-node/middleware/user-data/user-data')

function initStubs () {
  const stubs = {
    controllerStub: {
      getInstanceController: stub()
    },
    jsonpathStub: {
      query: jp.query.bind(jp)
    },
    setErrorsStub: {
      setErrors: stub()
    },
    validateRequiredStub: {
      isRequired: stub(),
      validateRequired: stub(),
      validateInstanceRequired: stub()
    },
    validateValueStub: {
      validateValue: stub(),
      validateInstanceValue: stub()
    }
  }

  rewiremock.enable()

  rewiremock.passBy('module-alias/register')

  rewiremock.isolation({
    noAutoPassBy: true
  })

  const stubConfig = {
    jsonpath: stubs.jsonpathStub,
    '~/fb-runner-node/page/set-errors/set-errors': stubs.setErrorsStub,
    './validate-required/validate-required': stubs.validateRequiredStub,
    './validate-value/validate-value': stubs.validateValueStub,
    '~/fb-runner-node/controller/controller': stubs.controllerStub
  }

  for (const [stubName, stubValue] of Object.entries(stubConfig)) {
    rewiremock(stubName).with(stubValue)
  }

  return stubs
}

setServiceInstances({
  'errors.summary.heading': {
    value: 'Something went wrong'
  }
})

FBLogger.verbose()

const getUserData = (input) => getUserDataMethods({input})

test('When validateInput is required ', t => {
  initStubs()
  const validateInput = require('./validate-input')
  t.equal(typeof validateInput, 'function', 'it should export a function')
  t.end()
})

test('When validating a page instance that has no controls', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    setErrorsStub
  } = initStubs()

  const validateInput = require('./validate-input')
  const pageInstance = {}
  const userData = getUserData({})

  validateInput(pageInstance, userData)

  t.ok(validateRequiredStub.validateRequired.notCalled, 'it should not call validateRequired method')
  t.ok(validateValueStub.validateValue.notCalled, 'it should not call validateValueStub method')
  t.ok(setErrorsStub.setErrors.notCalled, 'it should not call setErrors method')
  t.end()
})

test('When validating a page instance that has no errors', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    setErrorsStub,
    controllerStub
  } = initStubs()

  controllerStub.getInstanceController.returnsArg(0)

  const validateInput = require('./validate-input')

  const pageInstance = {
    _id: 'page',
    components: [{
      _id: 'a',
      _type: 'checkboxes',
      items: [{
        _id: 'b',
        _type: 'checkbox',
        name: 'test-b',
        value: 'yes-b'
      }, {
        _id: 'c',
        _type: 'checkbox',
        name: 'test-c',
        value: 'yes-c'
      }]
    }]
  }
  const userData = getUserData({
    'test-b': 'yes-b'
  })

  const pageInstanceArg = deepClone(pageInstance)
  pageInstanceArg.$validated = true
  setErrorsStub.setErrors.returnsArg(0)

  validateRequiredStub.validateRequired.returns([])
  validateValueStub.validateValue.returns([])

  validateInput(pageInstance, userData)

  const validateRequiredArgs = validateRequiredStub.validateRequired.getCall(0).args
  t.deepEqual(validateRequiredArgs[0], pageInstance, 'it should pass the pageInstance to validateRequired method')
  t.deepEqual(validateRequiredArgs[1], userData, 'it should pass the userData methods to validateRequired method')

  const validateValueArgs = validateValueStub.validateValue.getCall(0).args
  t.deepEqual(validateValueArgs[0], pageInstance, 'it should pass the pageInstance to validateValue method')
  t.deepEqual(validateValueArgs[1], userData, 'it should pass the userData methods to validateValue method')

  t.ok(setErrorsStub.setErrors.notCalled, 'it should not call setErrors method')
  t.end()
})

test('When validating a page instance that has no errors', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    setErrorsStub,
    controllerStub
  } = initStubs()

  controllerStub.getInstanceController.returnsArg(0)

  const validateInput = require('./validate-input')

  const pageInstance = {
    components: [{
      _id: 'a',
      _type: 'checkboxes',
      items: [{
        _id: 'b',
        _type: 'checkbox',
        name: 'test-b',
        value: 'yes-b'
      }, {
        _id: 'c',
        _type: 'checkbox',
        name: 'test-c',
        value: 'yes-c'
      }]
    }]
  }
  const userData = getUserData({
    'test-b': 'yes-b'
  })
  validateRequiredStub.validateRequired.callsFake(() => [])
  const errorExample = [{instance: {_id: 'a'}, errorType: 'boom'}]
  validateValueStub.validateValue.callsFake(() => errorExample)

  setErrorsStub.setErrors.callsFake((pageInstance, errors) => {
    return {...pageInstance, someErrors: errors}
  })

  const validatedPage = validateInput(deepClone(pageInstance), userData)
  const setErrorsArgs = setErrorsStub.setErrors.getCall(0).args

  t.deepEqual(setErrorsArgs[0], pageInstance, 'it should pass the pageInstance to the setErrors method')

  t.deepEqual(setErrorsArgs[1], errorExample, 'it should pass the errors to the setErrors method')

  t.deepEqual(validatedPage.someErrors, errorExample, 'it apply setErrors onto the page instance')
  t.deepEqual(validatedPage.$hasErrors, true, 'it should set the $hasErrors property on the page instance')

  t.deepEqual(controllerStub.getInstanceController.callCount, 2, 'getInstanceController should be invoked the correct number of times')

  t.end()
})

test('When getting the errors for an instance that is required', t => {
  const {
    validateRequiredStub,
    validateValueStub
  } = initStubs()

  const validateInput = require('./validate-input')

  validateRequiredStub.validateInstanceRequired.returns([])
  validateValueStub.validateInstanceValue.returns([])

  const noErrors = validateInput.getInstanceError({}, {})

  t.deepEqual(noErrors, undefined, 'it should return no errors')

  t.end()
})

test('When getting the errors for an instance that has an invalid value', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    controllerStub,
    setErrorsStub
  } = initStubs()

  const validateInput = require('./validate-input')
  const pageInstance = {
    components: [{
      name: 'foo'
    }]
  }

  validateRequiredStub.validateRequired.returns([])
  validateValueStub.validateValue.returns([])
  controllerStub.getInstanceController.returns({
    validate: () => {
      return [{errorType: 'component', instance: 'foo'}]
    }
  })
  setErrorsStub.setErrors.returns(pageInstance)

  const componentInstance = validateInput(pageInstance, {})

  t.deepEqual(setErrorsStub.setErrors.getCall(0).args, [{components: [{name: 'foo'}], $hasErrors: true}, [{errorType: 'component', instance: 'foo'}]], 'it should invoke setErrors with the correct args')
  t.deepEqual(componentInstance, {components: [{name: 'foo'}], $hasErrors: true}, 'it should annotate the page instance with $hasErrors')

  t.end()
})

test('When getting the errors for a compoiste instance that has an invalid value', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    controllerStub,
    setErrorsStub
  } = initStubs()

  const validateInput = require('./validate-input')
  const pageInstance = {
    components: [{
      name: 'bar',
      compositeName: 'foo-x',
      classes: 'baz'
    }]
  }

  validateRequiredStub.validateRequired.returns([])
  validateValueStub.validateValue.returns([])
  controllerStub.getInstanceController.returns({
    validate: () => {
      return [{errorType: 'component', instance: 'foo', compositeName: 'foo-x'}, {errorType: 'component', instance: 'foof', compositeName: 'foo-y'}]
    }
  })
  setErrorsStub.setErrors.returns(pageInstance)

  const compositeInstance = validateInput(pageInstance, {})

  t.deepEqual(compositeInstance.components[0].classes, 'baz govuk-input--error', 'it should add the error class without overriding any explicit value set for classes')

  t.end()
})

test('When getting the errors for an instance that is required', t => {
  const {
    validateRequiredStub,
    validateValueStub
  } = initStubs()

  const validateInput = require('./validate-input')

  validateRequiredStub.validateInstanceRequired.returns([{errorType: 'required'}])
  validateValueStub.validateInstanceValue.returns([{errorType: 'value'}])

  const requiredErrors = validateInput.getInstanceError({_id: 'required'}, {})

  t.deepEqual(requiredErrors, [{errorType: 'required'}], 'it should return required errors')

  t.end()
})

test('When getting the errors for an instance that has an invalid value', t => {
  const {
    validateRequiredStub,
    validateValueStub
  } = initStubs()

  const validateInput = require('./validate-input')

  validateRequiredStub.validateInstanceRequired.returns([])
  validateValueStub.validateInstanceValue.returns([{errorType: 'value'}])

  const valueErrors = validateInput.getInstanceError({}, {})

  t.deepEqual(valueErrors, [{errorType: 'value'}], 'it should return value errors')

  t.end()
})

test('When checking whether a valid instance has an error', t => {
  const validateInput = require('./validate-input')
  const getInstanceErrorStub = stub(validateInput, 'getInstanceError')
  getInstanceErrorStub.callsFake(() => undefined)
  const result = validateInput.instanceHasError({}, {})
  t.equal(result, false, 'it should return false')
  getInstanceErrorStub.restore()
  t.end()
})
test('When checking whether an invalid instance has an error', t => {
  const validateInput = require('./validate-input')
  const getInstanceErrorStub = stub(validateInput, 'getInstanceError')
  getInstanceErrorStub.callsFake(() => [])
  const result = validateInput.instanceHasError({}, {})
  t.equal(result, true, 'it should return true')
  getInstanceErrorStub.restore()
  t.end()
})
