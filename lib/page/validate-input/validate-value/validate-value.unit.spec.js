const test = require('tape')

const validateValue = require('./validate-value')
const {getUserDataMethods} = require('../../../middleware/user-data/user-data')
const getUserData = (input) => getUserDataMethods({input})

test('When validateInput is required ', t => {
  t.equal(typeof validateValue, 'function', 'it should export a function')
  t.end()
})

test('When validating instances which are valid', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'text',
    name: 'test-a'
  }]
  const userData = getUserData({
    'test-a': 'ok'
  })
  const expected = []
  t.deepEqual(validateValue(nameInstances, userData), expected, 'it should return no errors')
  t.end()
})

test('When validating instances that have no value', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'text',
    name: 'test-a'
  }]
  const undefinedUserData = getUserData({})
  const emptyUserData = getUserData({'test-a': ''})
  const expected = []
  t.deepEqual(validateValue(nameInstances, undefinedUserData), expected, 'it should return no errors if the value is undefined')
  t.deepEqual(validateValue(nameInstances, emptyUserData), expected, 'it should return no errors if the value is an empty string')
  t.end()
})

test('When validating instances which are not valid', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'text',
    name: 'test-a'
  }]
  const userData = getUserData({
    'test-a': 10
  })
  const errors = validateValue(nameInstances, userData)
  const expected = [{instance: nameInstances[0], errorType: 'type', error: {property: 'instance', message: 'is not of a type(s) string', schema: {type: 'string'}, instance: 10, name: 'type', argument: ['string'], stack: 'instance is not of a type(s) string'}}]

  t.deepEqual(errors, expected, 'it should return expected errors')
  t.end()
})

test('When validating instances which are numbers', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'number',
    name: 'test-a'
  }]
  const userData = getUserData({
    'test-a': 'a'
  })
  const errors = validateValue(nameInstances, userData)

  t.deepEqual(errors.length, 1, 'it should return expected errors')
  t.end()
})

test('When validating instances which already have error set', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    error: 'already got one'
  }]
  const userData = getUserData({
    'test-a': 'ok'
  })
  const expected = []
  t.deepEqual(validateValue(nameInstances, userData), expected, 'it should return no errors')
  t.end()
})

test('When validating instances which have no validation', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    validation: {}
  }]
  const userData = getUserData({})
  const expected = []
  t.deepEqual(validateValue(nameInstances, userData), expected, 'it should return no errors')
  t.end()
})

test('When validating instances which only have required validation', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'text',
    name: 'test-a',
    validation: {
      required: true
    }
  }]
  const userData = getUserData({})
  const expected = []
  t.deepEqual(validateValue(nameInstances, userData), expected, 'it should return no errors')
  t.end()
})

test('When validating email instances', t => {
  const nameInstances = [{
    _id: 'a',
    _type: 'email',
    name: 'test-a'
  }]
  const userData = getUserData({
    'test-a': 'test@test.com'
  })
  const failingUserData = getUserData({
    'test-a': 'test.com'
  })
  const expected = []
  t.deepEqual(validateValue(nameInstances, userData), expected, 'it should return no errors when validating a valid email address')
  t.notDeepEqual(validateValue(nameInstances, failingUserData), expected, 'it should return errors when validating an ivalid email address')
  t.end()
})
