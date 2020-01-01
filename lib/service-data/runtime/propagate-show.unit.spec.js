const test = require('tape')
const path = require('path')

const {propagate} = require('./propagate-show')

const getTestData = name => {
  const dataPath = path.resolve('data', 'show', `${name}.json`)
  return require(dataPath)
}

test('When propagating the show properties', function (t) {
  const input = getTestData('input-a')
  const expected = getTestData('expected-a')
  const instances = propagate(input)

  t.deepEqual(instances, expected, 'it should do so correctly')

  t.end()
})
