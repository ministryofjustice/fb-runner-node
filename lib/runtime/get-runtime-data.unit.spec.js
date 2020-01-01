const test = require('tape')
const path = require('path')

const {getRuntimeData} = require('./get-runtime-data')

const metadata = path.resolve('data', 'runtime', 'metadata')
const source1 = {
  source: 'source1',
  path: metadata
}

const getTestData = name => {
  const dataPath = path.resolve('data', `${name}.json`)
  return require(dataPath)
}

test('When transforming the edit-time instances into run-time ones', function (t) {
  t.plan(2)

  const sourceObjs = [source1]
  const schemas = getTestData('categories/schemas')
  const expected = getTestData('runtime/expected-a')
  getRuntimeData(sourceObjs, schemas)
    .then(instances => {
      t.equal(typeof instances.sourceInstances.data, 'object', 'it should return the source instances as the sourceInstances property')
      t.deepEqual(instances, expected, 'it should transform them into the expected structure')
    })
})
