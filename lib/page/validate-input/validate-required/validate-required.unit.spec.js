const test = require('tape')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const validateRequired = require('./validate-required')
const {getUserDataMethods} = require('../../../middleware/user-data/user-data')
const getUserData = (input) => getUserDataMethods({input})

const textNameInstances = [{
  _id: 'a',
  _type: 'text',
  name: 'test-a'
}]
const pageInstance = {
  components: textNameInstances
}

const valueUserData = getUserData({
  'test-a': 'ok'
})
const undefinedValueUserData = getUserData({})
const emptyValueUserData = getUserData({
  'test-a': '  '
})

test('When validateInput is required ', t => {
  t.equal(typeof validateRequired, 'function', 'it should export a function')
  t.end()
})

test('When validating a page instance which has a required control', t => {
  t.deepEqual(validateRequired(pageInstance, valueUserData).length, 0, 'it should not return an error if it has a value')

  t.deepEqual(validateRequired(pageInstance, undefinedValueUserData).length, 1, 'it should return an error if it has no value')

  t.deepEqual(validateRequired(pageInstance, emptyValueUserData).length, 1, 'it should return an error if it has a value but that value is only white space')
  t.end()
})

test('When validating an instance which has no required controls', t => {
  const notRequiredPageInstance = {
    components: [{
      _id: 'a',
      _type: 'text',
      name: 'test-a',
      validation: {
        required: false
      }
    }]
  }

  t.deepEqual(validateRequired(notRequiredPageInstance, undefinedValueUserData).length, 0, 'it should not return an error if it has no value')
  t.end()
})

test('When validating a page instance containing a checkbox instance', t => {
  const checkboxNameInstances = [{
    _id: 'a',
    _type: 'checkbox',
    name: 'test-a'
  }]
  const pageInstance = {}

  t.deepEqual(validateRequired(checkboxNameInstances, pageInstance, undefinedValueUserData).length, 0, 'it should not return an error')

  t.end()
})

test('When validating a page containing a checkboxes instance', t => {
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

  t.deepEqual(validateRequired(pageInstance, undefinedValueUserData).length, 0, 'it should not return an error if the checkboxes instance is not required')

  const requiredCheckboxPageInstance = deepClone(pageInstance)
  requiredCheckboxPageInstance.components[0].validation = {required: true}

  t.deepEqual(validateRequired(requiredCheckboxPageInstance, undefinedValueUserData).length, 1, 'it should return an error if the checkboxes instance is required and none of its items have a value')

  const valueUserData = getUserData({
    'test-b': 'yes-b'
  })
  t.deepEqual(validateRequired(requiredCheckboxPageInstance, valueUserData).length, 0, 'it should return an error if the checkboxes instance is required and any of its items have a value')

  const wrongValueUserData = getUserData({
    'test-b': 'yes-c'
  })
  t.deepEqual(validateRequired(requiredCheckboxPageInstance, wrongValueUserData).length, 1, 'it should return an error if the checkboxes instance is required and any of its items have a value ')
  t.end()
})
