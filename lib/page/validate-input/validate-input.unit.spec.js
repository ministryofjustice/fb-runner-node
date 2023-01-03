require('@ministryofjustice/module-alias/register-module')(module)

const rewiremock = require('rewiremock/node')
const jsonPath = require('jsonpath')
const test = require('tape')
const { stub } = require('sinon')

const { setServiceInstances } = require('~/fb-runner-node/service-data/service-data')
const cloneDeep = require('lodash.clonedeep')
const { getUserDataMethods } = require('~/fb-runner-node/middleware/user-data/user-data')

function initStubs () {
  const stubs = {
    getPageControllerStub: stub(),
    jsonpathStub: {
      query: jsonPath.query.bind(jsonPath)
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

  rewiremock.passBy('@ministryofjustice/module-alias/register')

  rewiremock.isolation({
    noAutoPassBy: true
  })

  const stubConfig = {
    jsonpath: stubs.jsonpathStub,
    '~/fb-runner-node/page/set-errors/set-errors': stubs.setErrorsStub,
    './validate-required/validate-required': stubs.validateRequiredStub,
    './validate-value/validate-value': stubs.validateValueStub,
    '~/fb-runner-node/controller/component/get-controller': stubs.getPageControllerStub
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

const getUserData = (input) => getUserDataMethods({ input })

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
    getPageControllerStub
  } = initStubs()

  getPageControllerStub.returnsArg(0)

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

  const pageInstanceArg = cloneDeep(pageInstance)
  pageInstanceArg.$validated = true
  setErrorsStub.setErrors.returnsArg(0)

  validateRequiredStub.validateRequired.returns([])
  validateValueStub.validateValue.returns([])

  validateInput(pageInstance, userData)

  const validateRequiredArgs = validateRequiredStub.validateRequired.getCall(0).args
  t.same(validateRequiredArgs[0], pageInstance, 'it should pass the pageInstance to validateRequired method')
  t.same(validateRequiredArgs[1], userData, 'it should pass the userData methods to validateRequired method')

  const validateValueArgs = validateValueStub.validateValue.getCall(0).args
  t.same(validateValueArgs[0], pageInstance, 'it should pass the pageInstance to validateValue method')
  t.same(validateValueArgs[1], userData, 'it should pass the userData methods to validateValue method')

  t.ok(setErrorsStub.setErrors.notCalled, 'it should not call setErrors method')
  t.end()
})

test('When validating a page instance that has no errors', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    setErrorsStub,
    getPageControllerStub
  } = initStubs()

  getPageControllerStub.returnsArg(0)

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
  const errorExample = [{ instance: { _id: 'a' }, errorType: 'boom' }]
  validateValueStub.validateValue.callsFake(() => errorExample)

  setErrorsStub.setErrors.callsFake((pageInstance, errors) => {
    return { ...pageInstance, someErrors: errors }
  })

  const validatedPage = validateInput(cloneDeep(pageInstance), userData)
  const setErrorsArgs = setErrorsStub.setErrors.getCall(0).args

  t.same(setErrorsArgs[0], pageInstance, 'it should pass the pageInstance to the setErrors method')

  t.same(setErrorsArgs[1], errorExample, 'it should pass the errors to the setErrors method')

  t.same(validatedPage.someErrors, errorExample, 'it apply setErrors onto the page instance')
  t.same(validatedPage.$hasErrors, true, 'it should set the $hasErrors property on the page instance')

  t.same(getPageControllerStub.callCount, 2, 'getPageController should be invoked the correct number of times')

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

  t.same(noErrors, undefined, 'it should return no errors')

  t.end()
})

test('When getting the errors for an instance that has an invalid value', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    getPageControllerStub,
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
  getPageControllerStub.returns({
    validate: () => {
      return [{ errorType: 'component', instance: 'foo' }]
    }
  })
  setErrorsStub.setErrors.returns(pageInstance)

  const componentInstance = validateInput(pageInstance, {})

  t.same(setErrorsStub.setErrors.getCall(0).args, [{ components: [{ name: 'foo' }], $hasErrors: true, $validated: false }, [{ errorType: 'component', instance: 'foo' }]], 'it should invoke setErrors with the correct args')
  t.same(componentInstance, { components: [{ name: 'foo' }], $hasErrors: true, $validated: false }, 'it should annotate the page instance with $hasErrors')

  t.end()
})

test('When getting the errors for a compoiste instance that has an invalid value', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    getPageControllerStub,
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
  getPageControllerStub.returns({
    validate: () => {
      return [{ errorType: 'component', instance: 'foo', compositeName: 'foo-x' }, { errorType: 'component', instance: 'foof', compositeName: 'foo-y' }]
    }
  })
  setErrorsStub.setErrors.returns(pageInstance)

  const compositeInstance = validateInput(pageInstance, {})

  t.same(compositeInstance.components[0].classes, 'baz govuk-input--error', 'it should add the error class without overriding any explicit value set for classes')

  t.end()
})

test('When getting the errors for an instance that is required', t => {
  const {
    validateRequiredStub,
    validateValueStub
  } = initStubs()

  const validateInput = require('./validate-input')

  validateRequiredStub.validateInstanceRequired.returns([{ errorType: 'required' }])
  validateValueStub.validateInstanceValue.returns([{ errorType: 'value' }])

  const requiredErrors = validateInput.getInstanceError({ _id: 'required' }, {})

  t.same(requiredErrors, [{ errorType: 'required' }], 'it should return required errors')

  t.end()
})

test('When getting the errors for an instance that has an invalid value', t => {
  const {
    validateRequiredStub,
    validateValueStub
  } = initStubs()

  const validateInput = require('./validate-input')

  validateRequiredStub.validateInstanceRequired.returns([])
  validateValueStub.validateInstanceValue.returns([{ errorType: 'value' }])

  const valueErrors = validateInput.getInstanceError({}, {})

  t.same(valueErrors, [{ errorType: 'value' }], 'it should return value errors')

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
