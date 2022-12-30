const {
  test
} = require('tap')
const path = require('path')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const debugStub = sinon.stub()
const logStub = sinon.stub()
const errorStub = sinon.stub()

debugStub.onCall(0).returns(logStub)
debugStub.onCall(1).returns(errorStub)

const {
  merge
} = proxyquire('./merge-instances', {
  debug: debugStub
})

test('Merging sources', (t) => {
  const input = require(path.resolve('data/merge/sources-a.json'))
  const expected = require(path.resolve('data/merge/expected-a.json'))

  t.same(merge(input), expected, 'returns the expected instances with annotations')

  t.end()
})

test('Merging sources and a referenced source is missing', (t) => {
  const input = require(path.resolve('data/merge/sources-missing-instance.json'))
  try {
    merge(input)
  } catch (e) {
    t.equal(e.name, 'MergeError', 'throws a MergeError')
    t.equal(e.message, 'No instance "z" found, referenced by "g"', 'reports the expected source')
    t.equal(e.code, 'ENOISA', 'returns ‘ENOISA’')
  }

  t.end()
})

test('Merging sources and a referenced source is missing', (t) => {
  const input = require(path.resolve('data/merge/sources-missing-source.json'))
  try {
    merge(input)
  } catch (e) {
    t.equal(e.name, 'MergeError', 'throws a MergeError')
    t.equal(e.message, 'No source "source2" for instance "e", referenced by "g"', 'reports the expected source')
    t.equal(e.code, 'ENOISASOURCE', 'returns ‘ENOISASOURCE’')
  }

  t.end()
})

test('Merging sources and a referenced instance that specifies its source is missing', (t) => {
  const input = require(path.resolve('data/merge/sources-missing-isa.json'))
  try {
    merge(input)
  } catch (e) {
    t.equal(e.name, 'MergeError', 'throws a MergeError')
    t.equal(e.message, 'No instance "e" found in source "source2", referenced by "g"', 'reports the expected instance id and source')
    t.equal(e.code, 'ENOISAINSOURCE', 'returns ‘ENOISAINSOURCE’')
  }

  t.end()
})
