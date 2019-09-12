const test = require('tape')
const {stub} = require('sinon')

const getUserCountPropertyStub = stub()
const resetStubs = () => {
  getUserCountPropertyStub.resetHistory()
  getUserCountPropertyStub.returns({})
}

const userData = {
  getUserCountProperty: getUserCountPropertyStub
}

const getRepeatableActions = require('./repeatable-actions')

test('When there is no minimum or maximum set on an initial repeating page', t => {
  resetStubs()

  const repeatableActions = getRepeatableActions({
    _id: 'foo',
    namePrefix: 'bar'
  }, userData)

  t.deepEqual(repeatableActions.stepRemove, undefined, 'it should not return a remove action')
  t.deepEqual(repeatableActions.stepAdd, {
    add: 'foo/bar',
    repeatableAdd: 'Add another'
  }, 'it should return an add action')

  t.end()
})

test('When a repeating page has no minimumn and has a lower index than the current count', t => {
  resetStubs()
  getUserCountPropertyStub.returns({current: 2})

  const repeatableActions = getRepeatableActions({
    _id: 'foo',
    namePrefix: 'bar[1]'
  }, userData)

  t.deepEqual(repeatableActions.stepRemove, {
    remove: 'bar=1',
    repeatableDelete: 'Remove'
  }, 'it should return a remove action')
  t.deepEqual(repeatableActions.stepAdd, undefined, 'it should not return an add action')

  t.end()
})

test('When a repeating page has a custom add string', t => {
  resetStubs()

  const repeatableActions = getRepeatableActions({
    _id: 'foo',
    namePrefix: 'bar',
    repeatableAdd: 'Push it'
  }, userData)

  t.deepEqual(repeatableActions.stepAdd, {
    add: 'foo/bar',
    repeatableAdd: 'Push it'
  }, 'it should return an add action if needed with the custom add string')

  t.end()
})

test('When a repeating page has a custom delete string', t => {
  resetStubs()
  getUserCountPropertyStub.returns({current: 2})

  const repeatableActions = getRepeatableActions({
    _id: 'foo',
    namePrefix: 'bar[1]',
    repeatableDelete: 'Zap it'
  }, userData)

  t.deepEqual(repeatableActions.stepRemove, {
    remove: 'bar=1',
    repeatableDelete: 'Zap it'
  }, 'it should return a remove action if needed with the custom delete string')

  t.end()
})

test('When a repeating page has reached its maximum', t => {
  resetStubs()

  const repeatableActions = getRepeatableActions({
    _id: 'foo',
    namePrefix: 'bar',
    repeatableMaximum: 1
  }, userData)

  t.deepEqual(repeatableActions.stepAdd, undefined, 'it should not return an add action')

  t.end()
})

test('When a repeating page has a minimum and has an index less than that minimum', t => {
  resetStubs()
  getUserCountPropertyStub.returns({current: 2})

  const repeatableActions = getRepeatableActions({
    _id: 'foo',
    repeatableMinimum: 2,
    namePrefix: 'bar[2]'
  }, userData)

  t.deepEqual(repeatableActions.stepRemove, undefined, 'it should not return a remove action')

  t.end()
})

test('When a repeating page has a maximum and has an index that is equal to it', t => {
  resetStubs()
  getUserCountPropertyStub.returns({current: 2})

  const repeatableActions = getRepeatableActions({
    _id: 'foo',
    repeatableMaximum: 2,
    namePrefix: 'bar[2]'
  }, userData)

  t.deepEqual(repeatableActions.stepAdd, undefined, 'it should not return an add action')

  t.end()
})
