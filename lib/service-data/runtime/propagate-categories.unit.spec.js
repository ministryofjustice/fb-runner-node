const test = require('tape')
const path = require('path')

const jp = require('jsonpath')

const {propagate} = require('./propagate-categories')

const getTestData = name => {
  const dataPath = path.resolve('data', 'categories', `${name}.json`)
  return require(dataPath)
}
const schemas = getTestData('schemas')

const getNestedInstance = (instances, id) => {
  return jp.query(instances, `$..[?(@._id === "${id}")]`)[0]
}

test('When propagating categories from an instance’s schema', function (t) {
  const input = getTestData('input-a')

  const instances = propagate(input, schemas)

  const foo = getNestedInstance(instances, 'foo')
  t.deepEqual(foo.$page, true, 'it should set the $[category] property of instances')

  t.end()
})
