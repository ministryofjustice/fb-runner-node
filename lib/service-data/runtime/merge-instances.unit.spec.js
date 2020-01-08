const test = require('tape')
const path = require('path')

const {merge} = require('./merge-instances')

test('When merging sources', function (t) {
  const input = require(path.resolve('data/merge/sources-a.json'))
  const expected = require(path.resolve('data/merge/expected-a.json'))

  const merged = merge(input)
  t.deepEqual(merged, expected, 'returns the expected instances with annotations')

  t.end()
})

test('When merging sources and a referenced source is missing', function (t) {
  t.plan(3)

  const input = require(path.resolve('data/merge/sources-missing-instance.json'))
  try {
    merge(input)
  } catch (e) {
    t.equal(e.name, 'MergeError', 'throws a MergeError')
    t.equal(e.message, 'No instance "z" found, referenced by "g"', 'reports the expected source')
    t.equal(e.code, 'ENOISA', 'returns ‘ENOISA’')
  }
})

test('When merging sources and a referenced source is missing', function (t) {
  t.plan(3)

  const input = require(path.resolve('data/merge/sources-missing-source.json'))
  try {
    merge(input)
  } catch (e) {
    t.equal(e.name, 'MergeError', 'throws a MergeError')
    t.equal(e.message, 'No source "source2" for instance "e", referenced by "g"', 'reports the expected source')
    t.equal(e.code, 'ENOISASOURCE', 'returns ‘ENOISASOURCE’')
  }
})

test('When merging sources and a referenced instance that specifies its source is missing', function (t) {
  t.plan(3)

  const input = require(path.resolve('data/merge/sources-missing-isa.json'))
  try {
    merge(input)
  } catch (e) {
    t.equal(e.name, 'MergeError', 'throws a MergeError')
    t.equal(e.message, 'No instance "e" found in source "source2", referenced by "g"', 'reports the expected instance id and source')
    t.equal(e.code, 'ENOISAINSOURCE', 'returns ‘ENOISAINSOURCE’')
  }
})
