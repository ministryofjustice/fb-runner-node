const test = require('tape')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {getUserDataMethods} = require('../../middleware/user-data/user-data')
const updateControlNames = require('./update-control-names')

const {getUserDataProperty: getUserDataPropertyEmpty} = getUserDataMethods({
  input: {}
})

const {getUserDataProperty: getUserDataPropertyHelloWorld} = getUserDataMethods({
  input: {
    hello: 'world'
  }
})

const {getUserDataProperty: getUserDataPropertySpace} = getUserDataMethods({
  input: {
    hello: 'space'
  }
})

test('When updateControlNames is required ', t => {
  t.equal(typeof updateControlNames, 'function', 'it should export a function')
  t.end()
})

test('When given a page that has no properties to update', t => {
  const pageInstanceEmpty = {}
  t.deepEqual(updateControlNames(pageInstanceEmpty, {}), {}, 'it should do nothing')
  t.end()
})

test('When given a page to update that has properties to update', t => {
  const pageInstance = {
    items: [{
      name: 'hello'
    }]
  }

  t.deepEqual(updateControlNames(pageInstance, getUserDataPropertyEmpty), pageInstance, 'it should not update name controls if no data passed')

  const pageExpected = deepClone(pageInstance)
  pageExpected.items[0].value = 'world'

  t.deepEqual(updateControlNames(pageInstance, getUserDataPropertyHelloWorld), pageExpected, 'it should update name controls if passed data that matches')

  t.deepEqual(updateControlNames(pageInstance, getUserDataPropertySpace), pageInstance, 'it should not update name controls if data does not match')

  const pageInstanceCheckbox = {
    items: [{
      name: 'hello',
      value: 'world'
    }, {
      name: 'goodbye',
      value: 'world'
    }]
  }

  t.deepEqual(updateControlNames(pageInstanceCheckbox, getUserDataPropertyEmpty), pageInstanceCheckbox, 'it should not update checkbox check value if no data passed')

  const pageExpectedCheckbox = deepClone(pageInstanceCheckbox)
  pageExpectedCheckbox.items[0].checked = true

  t.deepEqual(updateControlNames(pageInstanceCheckbox, getUserDataPropertyHelloWorld), pageExpectedCheckbox, 'it should update checkbox check value if passed data that matches')

  t.deepEqual(updateControlNames(pageInstanceCheckbox, getUserDataPropertySpace), pageInstanceCheckbox, 'it should not update checkbox check value if data does not match')

  t.end()
})

test('When given a page to update that has name controls that contain items', t => {
  const pageInstanceRadios = {
    x: {
      name: 'hello',
      items: [{
        _type: 'radio',
        value: 'world'
      }, {
        _type: 'radio',
        value: 'space'
      }]
    }
  }
  t.deepEqual(updateControlNames(pageInstanceRadios, getUserDataPropertyEmpty), pageInstanceRadios, 'it should not update radio checked values if no data passed')

  const pageExpectedRadios = deepClone(pageInstanceRadios)
  pageExpectedRadios.x.items[0].checked = true
  t.deepEqual(updateControlNames(pageInstanceRadios, getUserDataPropertyHelloWorld), pageExpectedRadios, 'it should update radio checked values if passed data that matches')

  t.deepEqual(updateControlNames(pageInstanceRadios, getUserDataPropertySpace), pageInstanceRadios, 'it should not update radio checked values if data does not match')

  const pageInstanceSelect = {
    x: {
      name: 'hello',
      items: [{
        _type: 'option',
        value: 'world'
      }, {
        _type: 'option',
        value: 'space'
      }]
    }
  }
  t.deepEqual(updateControlNames(pageInstanceSelect, getUserDataPropertyEmpty), pageInstanceSelect, 'it should not update options selected values if no data passed')
  const pageExpectedSelect = deepClone(pageInstanceSelect)
  pageExpectedSelect.x.items[0].selected = true
  t.deepEqual(updateControlNames(pageInstanceSelect, getUserDataPropertyHelloWorld), pageExpectedSelect, 'it should update option selected values if passed data that matches')

  t.deepEqual(updateControlNames(pageInstanceSelect, getUserDataPropertySpace), pageInstanceSelect, 'it should not update option selected values if data does not match')

  t.end()
})
