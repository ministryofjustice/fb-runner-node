require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')

const cloneDeep = require('lodash.clonedeep')

const { getUserDataMethods } = require('~/fb-runner-node/middleware/user-data/user-data')
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

  t.deepEqual(updateControlNames(cloneDeep(pageInstance), userDataPropertyEmpty), pageInstance, 'it should not update name controls if no data passed')

  const pageExpected = cloneDeep(pageInstance)
  pageExpected.items[0].value = 'world'

  t.deepEqual(updateControlNames(cloneDeep(pageInstance), userDataPropertyHelloWorld), pageExpected, 'it should update name controls if passed data that matches')

  const pageInstanceCheckbox = {
    items: [{
      name: 'hello',
      value: 'world'
    }, {
      name: 'goodbye',
      value: 'world'
    }]
  }

  t.deepEqual(updateControlNames(cloneDeep(pageInstanceCheckbox), userDataPropertyEmpty), pageInstanceCheckbox, 'it should not update checkbox check value if no data passed')

  const pageExpectedCheckbox = cloneDeep(pageInstanceCheckbox)
  pageExpectedCheckbox.items[0].checked = true

  t.deepEqual(updateControlNames(cloneDeep(pageInstanceCheckbox), userDataPropertyHelloWorld), pageExpectedCheckbox, 'it should update checkbox check value if passed data that matches')

  t.deepEqual(updateControlNames(cloneDeep(pageInstanceCheckbox), userDataPropertySpace), pageInstanceCheckbox, 'it should not update checkbox check value if data does not match')

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
  t.deepEqual(updateControlNames(cloneDeep(pageInstanceRadios), userDataPropertyEmpty), pageInstanceRadios, 'it should not update radio checked values if no data passed')

  const pageExpectedRadios = cloneDeep(pageInstanceRadios)
  pageExpectedRadios.x.items[0].checked = true
  t.deepEqual(updateControlNames(cloneDeep(pageInstanceRadios), userDataPropertyHelloWorld), pageExpectedRadios, 'it should update radio checked values if passed data that matches')

  const pageExpectedRadiosB = cloneDeep(pageInstanceRadios)
  pageExpectedRadiosB.x.items[1].checked = true
  t.deepEqual(updateControlNames(cloneDeep(pageInstanceRadios), userDataPropertySpace), pageExpectedRadiosB, 'it should update radio checked values if passed data that matches - part 2')

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
  t.deepEqual(updateControlNames(cloneDeep(pageInstanceSelect), userDataPropertyEmpty), pageInstanceSelect, 'it should not update options selected values if no data passed')
  const pageExpectedSelect = cloneDeep(pageInstanceSelect)
  pageExpectedSelect.x.items[0].selected = true
  t.deepEqual(updateControlNames(cloneDeep(pageInstanceSelect), userDataPropertyHelloWorld), pageExpectedSelect, 'it should update option selected values if passed data that matches')

  const pageExpectedSelectB = cloneDeep(pageInstanceSelect)
  pageExpectedSelectB.x.items[1].selected = true
  t.deepEqual(updateControlNames(cloneDeep(pageInstanceSelect), userDataPropertySpace), pageExpectedSelectB, 'it should update option selected values if passed data that matches - part 2')

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
  const expected = cloneDeep(pageInstanceCheckboxes)
  expected.x.name = 'foo'
  t.deepEqual(updateControlNames(cloneDeep(pageInstanceCheckboxes), userDataPropertyEmpty), expected, 'it should set their name properties to their _id')

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
  const expected = cloneDeep(pageInstanceCheckboxes)
  t.deepEqual(updateControlNames(cloneDeep(pageInstanceCheckboxes), userDataPropertyEmpty), expected, 'it should leave hem alone')

  t.end()
})
