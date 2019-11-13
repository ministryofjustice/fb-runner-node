const {
  test
} = require('tap')

const sinon = require('sinon')

const {
  isObject,
  hasGroup,
  aggregateGroups,
  aggregateGroup,
  transformGroup
} = require('./pdf-payload.transformers')

test('Something is an object', (t) => {
  t.equals(isObject({}), true, 'returns true when the argument is an object')

  t.end()
})

test('An item is not an object', (t) => {
  t.equals(isObject(), false, 'returns false when the argument is undefined (or no argument is supplied)')

  t.equals(isObject(null), false, 'returns false when the argument is null')

  t.equals(isObject(true), false, 'returns false when the argument is a boolean')

  t.equals(isObject(1), false, 'returns false when the argument is a number')

  t.equals(isObject('A'), false, 'returns false when the argument is a string')

  t.end()
})

test('A collection contains an object with the `groupBy` field', (t) => {
  t.equals([{groupBy: 'group-id'}].some(hasGroup('group-id')), true, 'returns true when the group is found')

  t.equals([{groupBy: 'not-group-id'}].some(hasGroup('group-id')), false, 'returns false when the group is not found')

  t.equals([].some(hasGroup('group-id')), false, 'returns false when the group is not found because the collection is empty')

  t.end()
})

test('Aggregating the group', (t) => {
  const accumulator = {
    value: {
      html: ['A', 'B'],
      text: ['A', 'B'],
      machine: ['A', 'B']
    }
  }

  const current = {
    value: {
      html: ['C'],
      text: ['C'],
      machine: ['C']
    }
  }

  const expected = {
    value: {
      html: ['A', 'B', 'C'],
      text: ['A', 'B', 'C'],
      machine: ['A', 'B', 'C']
    }
  }

  t.deepEqual(aggregateGroup(accumulator, current), expected, 'returns the aggregated group (with appended values)')

  t.end()
})

test('Aggregating the group when it has been encountered before', (t) => {
  const accumulatorStub = {
    some: sinon.stub().returns(true)
  }

  const current = {}
  const index = 0
  const answers = []

  t.type(aggregateGroups(accumulatorStub, current, index, answers), accumulatorStub, 'returns `accumulator`')

  t.type(accumulatorStub.some.firstCall.args[0], Function, 'calls `some` on the collection')

  t.end()
})

test('Aggregating the group when it has not been encountered before', (t) => {
  const array = []
  const accumulatorStub = {
    some: sinon.stub().returns(false),
    concat: sinon.stub().returns(array)
  }

  const groupStub = {
    reduce: sinon.stub().returns({
      value: {
        html: ['A', 'B', 'C'],
        text: ['A', 'B', 'C'],
        machine: ['A', 'B', 'C']
      }
    })
  }

  const answersStub = {
    filter: sinon.stub().returns(groupStub)
  }

  t.equals(aggregateGroups(accumulatorStub, {}, 0, answersStub), array, 'returns from `accumulator.concat()`')

  t.type(accumulatorStub.some.firstCall.args[0], Function, 'calls `some` on the collection')

  t.type(answersStub.filter.firstCall.args[0], Function, 'calls `filter` on the collection (to select groups by the `groupBy` field)')

  t.type(accumulatorStub.concat.firstCall.args[0], Object, 'calls `concat` on the collection (to append an object)')

  t.end()
})

test('Transforming the aggregated group when it contains one item', (t) => {
  const answer = {
    groupBy: 'component-id',
    component: 'component-id',
    key: {
      html: 'Component',
      text: 'Component'
    },
    value: {
      html: '1',
      text: '1',
      machine: 1
    }
  }

  const groupStub = {
    length: 1
  }

  const expected = {
    groupBy: 'component-id',
    component: 'component-id',
    key: {
      html: 'Component',
      text: 'Component'
    },
    value: {
      html: '1',
      text: '1',
      machine: 1
    }
  }

  t.deepEqual(transformGroup(answer, groupStub), expected, 'returns the transformed group')

  t.end()
})

test('Transforming the aggregated group when it contains more than one item', (t) => {
  const answer = {
    groupBy: 'group-id',
    key: {}
  }

  const groupStub = {
    length: 3,
    reduce: sinon.stub().returns({
      value: {
        html: ['A', 'B', 'C'],
        text: ['A', 'B', 'C'],
        machine: ['A', 'B', 'C']
      }
    })
  }

  const expected = {
    groupBy: 'group-id',
    component: 'group-id',
    key: {},
    value: {
      html: 'A\n\nB\n\nC',
      text: 'A\n\nB\n\nC',
      machine: 'A\n\nB\n\nC'
    }
  }

  t.deepEqual(transformGroup(answer, groupStub), expected, 'returns the transformed group')

  t.end()
})
