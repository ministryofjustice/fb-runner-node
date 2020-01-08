const test = require('tape')
const path = require('path')

const {
  getRuntimeData
} = require('./get-runtime-data')

const source = {
  source: 'source1',
  path: path.resolve('data/runtime/metadata')
}

test('When transforming the edit-time instances into run-time ones', (t) => {
  t.plan(2)

  const sources = [source]
  const schemas = require(path.resolve('data/categories/schemas'))
  /*
   *  This is a JS object, not JSON
   */
  const expected = require(path.resolve('data/runtime/expected'))

  getRuntimeData(sources, schemas)
    .then((runtimeData) => {
      t.ok(runtimeData.sourceInstances.data, 'assigns the source instances to the `sourceInstances` field')

      t.deepEqual(runtimeData, expected, 'transforms the source instances')
    })
})
