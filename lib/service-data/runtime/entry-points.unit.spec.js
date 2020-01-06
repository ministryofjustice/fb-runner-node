const test = require('tape')

const {getEntryPointKeys, getEntryPointInstances} = require('./entry-points')

const data = {
  topA: {
    _id: 'topA',
    _type: 'page.start',
    steps: [
      'stepA',
      'stepB'
    ]
  },
  stepA: {
    _id: 'stepA',
    _type: 'page.singlequestion',
    steps: [
      'stepC'
    ]
  },
  stepB: {
    _id: 'stepB',
    _type: 'page.form'
  },
  stepC: {
    _id: 'stepC',
    _type: 'page.content'
  },
  topB: {
    _id: 'topB',
    _type: 'page.content'
  }
}

test('When getting the entry points', function (t) {
  const keys = getEntryPointKeys(data)

  t.deepEquals(keys, ['topA', 'topB'], 'it should return keys of instances that are not the step of another instance')

  t.end()
})

test('When getting the entry points', function (t) {
  const instances = getEntryPointInstances(data)

  t.deepEquals(Object.keys(instances), ['topA', 'topB'], 'it should return instances that are not the step of another instance')
  t.ok(instances.topA === data.topA && instances.topB === data.topB, 'it should return the instances rather than copies of them')

  t.end()
})
