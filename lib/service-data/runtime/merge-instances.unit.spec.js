const test = require('tape')
const path = require('path')

const {merge} = require('./merge-instances')

const getTestData = name => {
  const dataPath = path.resolve('data', 'merge', `${name}.json`)
  return require(dataPath)
}

test('When merging sources', function (t) {
  const input = getTestData('sources-a')
  const expected = getTestData('expected-a')

  const merged = merge(input)
  t.deepEqual(merged, expected, 'it should return the correct instances with the correct annotations')

  t.end()
})

test('When merging sources and a referenced source is missing', function (t) {
  t.plan(3)

  const input = getTestData('sources-missing-instance')
  try {
    /* eslint-disable no-unused-vars */
    const merged = merge(input)
    /* eslint-enable no-unused-vars */
  } catch (e) {
    t.equal(e.name, 'FBMergeError', 'it should throw an FBMergeError')
    t.equal(e.message, 'No instance "z" found, referenced by "g"', 'it should report the expected source')
    t.equal(e.code, 'ENOISA', 'it should return the correct error code')
  }
})

test('When merging sources and a referenced source is missing', function (t) {
  t.plan(3)

  const input = getTestData('sources-missing-source')
  try {
    /* eslint-disable no-unused-vars */
    const merged = merge(input)
    /* eslint-enable no-unused-vars */
  } catch (e) {
    t.equal(e.name, 'FBMergeError', 'it should throw an FBMergeError')
    t.equal(e.message, 'No source "source2" for instance "e", referenced by "g"', 'it should report the expected source')
    t.equal(e.code, 'ENOISASOURCE', 'it should return the correct error code')
  }
})

test('When merging sources and a referenced instance that specifies its source is missing', function (t) {
  t.plan(3)

  const input = getTestData('sources-missing-isa')
  try {
    /* eslint-disable no-unused-vars */
    const merged = merge(input)
    /* eslint-enable no-unused-vars */
  } catch (e) {
    t.equal(e.name, 'FBMergeError', 'it should throw an FBMergeError')
    t.equal(e.message, 'No instance "e" found in source "source2", referenced by "g"', 'it should report the expected instance id and source')
    t.equal(e.code, 'ENOISAINSOURCE', 'it should return the correct error code')
  }
})
