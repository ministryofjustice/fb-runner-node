require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')

const {deepClone} = require('@ministryofjustice/fb-utils-node')

const {getUserDataMethods} = require('~/fb-runner-node/middleware/user-data/user-data')
const updateControlNames = require('./update-control-names')

const userDataPropertyEmpty = getUserDataMethods({
  input: {}
})

const userDataPropertyHelloWorld = getUserDataMethods({
  input: {
    hello: 'world'
  }
})

const userDataPropertySpace = getUserDataMethods({
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
  t.deepEqual(updateControlNames(pageInstanceEmpty, userDataPropertyEmpty), {}, 'it should do nothing')
  t.end()
})

test('When given a page to update that has controls', t => {
  const pageInstance = {
    items: [{
      name: 'hello'
    }]
  }

  t.deepEqual(updateControlNames(deepClone(pageInstance), userDataPropertyEmpty), pageInstance, 'it should not update name controls if no data passed')

  const pageExpected = deepClone(pageInstance)
  pageExpected.items[0].value = 'world'

  t.deepEqual(updateControlNames(deepClone(pageInstance), userDataPropertyHelloWorld), pageExpected, 'it should update name controls if passed data that matches')

  const pageInstanceCheckbox = {
    items: [{
      name: 'hello',
      value: 'world'
    }, {
      name: 'goodbye',
      value: 'world'
    }]
  }

  t.deepEqual(updateControlNames(deepClone(pageInstanceCheckbox), userDataPropertyEmpty), pageInstanceCheckbox, 'it should not update checkbox check value if no data passed')

  const pageExpectedCheckbox = deepClone(pageInstanceCheckbox)
  pageExpectedCheckbox.items[0].checked = true

  t.deepEqual(updateControlNames(deepClone(pageInstanceCheckbox), userDataPropertyHelloWorld), pageExpectedCheckbox, 'it should update checkbox check value if passed data that matches')

  t.deepEqual(updateControlNames(deepClone(pageInstanceCheckbox), userDataPropertySpace), pageInstanceCheckbox, 'it should not update checkbox check value if data does not match')

  t.end()
})

test('When given a page to update that has controls that contain items', t => {
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
  t.deepEqual(updateControlNames(deepClone(pageInstanceRadios), userDataPropertyEmpty), pageInstanceRadios, 'it should not update radio checked values if no data passed')

  const pageExpectedRadios = deepClone(pageInstanceRadios)
  pageExpectedRadios.x.items[0].checked = true
  t.deepEqual(updateControlNames(deepClone(pageInstanceRadios), userDataPropertyHelloWorld), pageExpectedRadios, 'it should update radio checked values if passed data that matches')

  const pageExpectedRadiosB = deepClone(pageInstanceRadios)
  pageExpectedRadiosB.x.items[1].checked = true
  t.deepEqual(updateControlNames(deepClone(pageInstanceRadios), userDataPropertySpace), pageExpectedRadiosB, 'it should update radio checked values if passed data that matches - part 2')

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
  t.deepEqual(updateControlNames(deepClone(pageInstanceSelect), userDataPropertyEmpty), pageInstanceSelect, 'it should not update options selected values if no data passed')
  const pageExpectedSelect = deepClone(pageInstanceSelect)
  pageExpectedSelect.x.items[0].selected = true
  t.deepEqual(updateControlNames(deepClone(pageInstanceSelect), userDataPropertyHelloWorld), pageExpectedSelect, 'it should update option selected values if passed data that matches')

  const pageExpectedSelectB = deepClone(pageInstanceSelect)
  pageExpectedSelectB.x.items[1].selected = true
  t.deepEqual(updateControlNames(deepClone(pageInstanceSelect), userDataPropertySpace), pageExpectedSelectB, 'it should update option selected values if passed data that matches - part 2')

  t.end()
})

// checkbooxes names
test('When given a page to update that contains checkboxes without names', t => {
  const pageInstanceCheckboxes = {
    x: {
      _type: 'checkboxes',
      _id: 'foo',
      items: [{
        _type: 'checkbox',
        name: 'world',
        value: 'yes'
      }, {
        _type: 'checkbox',
        name: 'space',
        value: 'yes'
      }]
    }
  }
  const expected = deepClone(pageInstanceCheckboxes)
  expected.x.name = 'foo'
  t.deepEqual(updateControlNames(deepClone(pageInstanceCheckboxes), userDataPropertyEmpty), expected, 'it should set their name properties to their _id')

  t.end()
})

test('When given a page to update that contains checkboxes with names', t => {
  const pageInstanceCheckboxes = {
    x: {
      _type: 'checkboxes',
      _id: 'foo',
      name: 'bar',
      items: [{
        _type: 'checkbox',
        name: 'world',
        value: 'yes'
      }, {
        _type: 'checkbox',
        name: 'space',
        value: 'yes'
      }]
    }
  }
  const expected = deepClone(pageInstanceCheckboxes)
  t.deepEqual(updateControlNames(deepClone(pageInstanceCheckboxes), userDataPropertyEmpty), expected, 'it should leave hem alone')

  t.end()
})
