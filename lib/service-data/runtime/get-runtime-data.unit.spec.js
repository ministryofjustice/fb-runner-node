const test = require('tape')
const path = require('path')

const {
  getRuntimeData
} = require('./get-runtime-data')

const source = {
  source: 'source1',
  path: path.resolve('data/runtime/metadata')
}

test('When transforming the edit-time instances into run-time ones', function (t) {
  t.plan(2)

  const sources = [source]
  const schemas = require(path.resolve('data/categories/schemas.json'))
  const expected = require(path.resolve('data/runtime/expected-a.json'))

  getRuntimeData(sources, schemas)
    .then((instances) => {
      t.equal(typeof instances.sourceInstances.data, 'object', 'it should return the source instances as the sourceInstances property')
      /*
       *  Serialising and deserialising removes fields with "undefined" values
       *
       *  TODO:
       *  Amend the "expected" object to correctly (and exactly) represent the instance
       */
      t.deepEqual(JSON.parse(JSON.stringify(instances)), expected, 'it should transform them into the expected structure')
    })
})
