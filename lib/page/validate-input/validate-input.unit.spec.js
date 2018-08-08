const test = require('tape')
const {spy, stub} = require('sinon')

const validateInput = require('./validate-input')

const {setServiceInstances} = require('../../service-data/service-data')
setServiceInstances({
  'errors.summary.heading': {
    value: 'Something went wrong'
  }
})

const {deepClone, FBLogger} = require('@ministryofjustice/fb-utils-node')
FBLogger.verbose()

const {getUserDataMethods} = require('../../middleware/user-data/user-data')
const getUserData = (input) => getUserDataMethods({input})

test('When validateInput is required ', t => {
  t.equal(typeof validateInput, 'function', 'it should export a function')
  t.end()
})

test('When validating a page instance that has no controls', t => {
  const pageInstance = {}
  const userData = getUserData({})

  const validateRequiredSpy = spy(validateInput, 'validateRequired')
  const validateValueSpy = spy(validateInput, 'validateValue')
  const setErrorsSpy = spy(validateInput, 'setErrors')

  validateInput(pageInstance, userData)

  t.ok(validateRequiredSpy.notCalled, 'it should not call validateRequiredSpy method')
  t.ok(validateValueSpy.notCalled, 'it should not call setErrors method')
  t.ok(setErrorsSpy.notCalled, 'it should not call setErrors method')

  validateRequiredSpy.restore()
  validateValueSpy.restore()
  setErrorsSpy.restore()
  t.end()
})

test('When validating a page instance that has no errors', t => {
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

  const validateRequiredSpy = spy(validateInput, 'validateRequired')
  const validateValueSpy = spy(validateInput, 'validateValue')
  const setErrorsSpy = spy(validateInput, 'setErrors')

  validateInput(deepClone(pageInstance), userData)

  const validateRequiredArgs = validateRequiredSpy.getCall(0).args
  t.deepEqual(validateRequiredArgs[0], pageInstance, 'it should pass the pageInstance to validateRequired method')
  t.deepEqual(validateRequiredArgs[1], userData, 'it should pass the userData methods to validateRequired method')

  const validateValueArgs = validateValueSpy.getCall(0).args
  t.deepEqual(validateValueArgs[0], pageInstance, 'it should pass the pageInstance to validateValue method')
  t.deepEqual(validateValueArgs[1], userData, 'it should pass the userData methods to validateValue method')

  t.ok(setErrorsSpy.notCalled, 'it should not call setErrors method')

  validateRequiredSpy.restore()
  validateValueSpy.restore()
  setErrorsSpy.restore()
  t.end()
})

test('When validating a page instance that has no errors', t => {
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

  const validateRequiredStub = stub(validateInput, 'validateRequired')
  validateRequiredStub.callsFake(() => [])
  const validateValueStub = stub(validateInput, 'validateValue')
  validateValueStub.callsFake(() => [{
    instance: {
      _id: 'a'
    },
    errorType: 'boom'}])

  const setErrorsSpy = spy(validateInput, 'setErrors')

  const validatedPage = validateInput(deepClone(pageInstance), userData)

  const setErrorsArgs = setErrorsSpy.getCall(0).args

  t.deepEqual(setErrorsArgs[0], pageInstance, 'it should pass the pageInstance to the setErrors method')
  t.deepEqual(setErrorsArgs[1], [{
    instance: {
      _id: 'a'
      // error: 'boom'
    },
    errorType: 'boom'
  }], 'it should pass the errors to the setErrors method')

  t.deepEqual(validatedPage.errorList, [{html: 'boom', href: '#a'}], 'it should set the errorList on the page instance')
  t.equal(validatedPage.errorTitle, 'Something went wrong', 'it should set the errorTitle property on the page instance')
  t.deepEqual(validatedPage.$hasErrors, true, 'it should set the $hasErrors property on the page instance')

  validateRequiredStub.restore()
  validateValueStub.restore()
  setErrorsSpy.restore()
  t.end()
})
