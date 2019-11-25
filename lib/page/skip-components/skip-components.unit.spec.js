require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')

const {deepClone} = require('@ministryofjustice/fb-utils-node')
const UserData = require('~/fb-runner-node/middleware/user-data/user-data')

const skipComponents = require('./skip-components')

const skipComponentsClone = (instance, input) => {
  const userData = UserData.getUserDataMethods({input}, {}, {})
  return skipComponents(deepClone(instance), userData)
}

test('When skipComponents is required ', t => {
  t.equal(typeof skipComponents, 'function', 'it should export a function')
  t.end()
})

test('When given a page that has no components to remove', t => {
  const pageInstanceEmpty = {}
  t.deepEqual(skipComponentsClone(pageInstanceEmpty, {}), {}, 'it should do nothing')
  t.end()
})

test('When given a page has components to remove', t => {
  const pageInstance = {
    items: [{
      _id: 'a',
      show: false
    }, {
      _id: 'b'
    }]
  }
  const pageExpected = deepClone(pageInstance)
  pageExpected.items.splice(0, 1)
  t.deepEqual(skipComponentsClone(pageInstance, {}), pageExpected, 'it should remove the components that are array items')

  const pageInstanceProp = {
    x: {
      _id: 'a',
      show: false
    }
  }
  const pageExpectedProp = deepClone(pageInstanceProp)
  delete pageExpectedProp.x
  t.deepEqual(skipComponentsClone(pageInstanceProp, {}), pageExpectedProp, 'it should remove the components that are object properties')

  const pageInstanceNested = {
    items: [{
      _id: 'a',
      show: false,
      items: [{
        _id: 'c',
        show: false
      }]
    }, {
      _id: 'b'
    }]
  }
  const pageExpectedNested = deepClone(pageInstanceNested)
  pageExpectedNested.items.splice(0, 1)
  t.deepEqual(skipComponentsClone(pageInstanceNested, {}), pageExpectedNested, 'it should remove components that have subcomponents that should also be removed')

  const pageInstanceInput = {
    items: [{
      _id: 'a',
      show: {
        identifier: 'x',
        operator: 'is',
        value: 'y'
      }
    }, {
      _id: 'b'
    }]
  }
  const pageExpectedInput = deepClone(pageInstanceInput)
  pageExpectedInput.items.splice(0, 1)
  t.deepEqual(skipComponentsClone(pageInstanceInput, {}), pageExpectedInput, 'it should remove a component when its condition evaluates to true')
  t.deepEqual(skipComponentsClone(pageInstanceInput, {x: 'y'}), pageInstanceInput, 'it should not remove a component when its condition evaluates to true')

  t.end()
})
