const rewiremock = require('rewiremock/node')
const jp = require('jsonpath')
const test = require('tape')
const {stub} = require('sinon')
const {default: produce} = require('immer')

const {setServiceInstances} = require('../../service-data/service-data')
const {deepClone, FBLogger} = require('@ministryofjustice/fb-utils-node')
const {getUserDataMethods} = require('../../middleware/user-data/user-data')

function initStubs () {
  const stubs = {
    jsonpathStub: {
      query: jp.query.bind(jp)
    },
    immerStub: {
      default: produce
    },
    setErrorsStub: {
      setErrors: stub()
    },
    validateRequiredStub: stub(),
    validateValueStub: stub(),
    componentsStub: {}
  }

  rewiremock.enable()

  rewiremock.isolation({
    noAutoPassBy: true
  })

  const stubConfig = {
    jsonpath: stubs.jsonpathStub,
    immer: stubs.immerStub,
    '../set-errors/set-errors': stubs.setErrorsStub,
    './validate-required/validate-required': stubs.validateRequiredStub,
    './validate-value/validate-value': stubs.validateValueStub,
    '../component/component': stubs.componentsStub
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

  t.ok(validateRequiredStub.notCalled, 'it should not call validateRequired method')
  t.ok(validateValueStub.notCalled, 'it should not call validateValueStub method')
  t.ok(setErrorsStub.setErrors.notCalled, 'it should not call setErrors method')

  t.end()
})

test('When validating a page instance that has no errors', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    setErrorsStub
  } = initStubs()

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

  validateRequiredStub.returns([])
  validateValueStub.returns([])

  validateInput(deepClone(pageInstance), userData)

  const validateRequiredArgs = validateRequiredStub.getCall(0).args
  t.deepEqual(validateRequiredArgs[0], pageInstance, 'it should pass the pageInstance to validateRequired method')
  t.deepEqual(validateRequiredArgs[1], userData, 'it should pass the userData methods to validateRequired method')

  const validateValueArgs = validateValueStub.getCall(0).args
  t.deepEqual(validateValueArgs[0], pageInstance, 'it should pass the pageInstance to validateValue method')
  t.deepEqual(validateValueArgs[1], userData, 'it should pass the userData methods to validateValue method')

  t.ok(setErrorsStub.setErrors.notCalled, 'it should not call setErrors method')

  t.end()
})

test('When validating a page instance that has no errors', t => {
  const {
    validateRequiredStub,
    validateValueStub,
    setErrorsStub
  } = initStubs()

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
  validateRequiredStub.callsFake(() => [])
  const errorExample = [{instance: {_id: 'a'}, errorType: 'boom'}]
  validateValueStub.callsFake(() => errorExample)

  setErrorsStub.setErrors.callsFake((pageInstance, errors) => {
    return {...pageInstance, someErrors: errors}
  })

  const validatedPage = validateInput(deepClone(pageInstance), userData)
  const setErrorsArgs = setErrorsStub.setErrors.getCall(0).args

  t.deepEqual(setErrorsArgs[0], pageInstance, 'it should pass the pageInstance to the setErrors method')

  t.deepEqual(setErrorsArgs[1], errorExample, 'it should pass the errors to the setErrors method')

  t.deepEqual(validatedPage.someErrors, errorExample, 'it apply setErrors onto the page instance')
  t.deepEqual(validatedPage.$hasErrors, true, 'it should set the $hasErrors property on the page instance')

  t.end()
})
