const test = require('tape')

const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {get, set, unset} = require('./control-path')

const data = {
  a: {
    b: [{
      c: true
    }, {
      c: false
    }]
  }
}

test('When getting the value of a path', t => {
  const testData = deepClone(data)

  t.deepEqual(get(testData, 'a[b]'), [{c: true}, {c: false}], 'it should...')
  t.deepEqual(get(testData, 'a["b"]'), [{c: true}, {c: false}], 'it should...')
  t.deepEqual(get(testData, 'a[\'b\']'), [{c: true}, {c: false}], 'it should...')
  t.deepEqual(get(testData, 'a[b][0]'), {c: true}, 'it should...')
  t.deepEqual(get(testData, 'a[b][0][c]'), true, 'it should...')
  t.deepEqual(get(testData, 'a[d]'), undefined, 'it should...')
  t.deepEqual(get(testData, 'a[d]', 'default value'), 'default value', 'it should...')
  t.end()
})

test('When setting the value of a path', t => {
  const testData = deepClone(data)

  const setUndefined = set(testData, 'a[d]', 'value')
  t.deepEqual(get(testData, 'a[d]'), 'value', 'it should...')
  t.deepEqual(setUndefined, 'value', 'it should...')

  set(testData, 'a[b][0][c]', false)
  t.deepEqual(testData.a.b[0].c, false, 'it should...')

  set(testData, 'a[b][0]', {e: true, f: [1, 2]})
  t.deepEqual(testData.a.b[0], {e: true, f: [1, 2]}, 'it should...')

  set(testData, 'a[b]', 'value')
  t.deepEqual(testData.a.b, 'value', 'it should...')

  set(testData, 'a[b][0][c]', true)
  t.deepEqual(testData.a.b[0].c, true, 'it should...')

  set(testData, 'a["b"][0][\'c\']', false)
  t.deepEqual(testData.a.b[0].c, false, 'it should...')

  t.end()
})

test('When unsetting the value of a path', t => {
  const testData = deepClone(data)

  unset(testData, 'a[b][0][c]')
  t.deepEqual(testData.a.b[0].c, undefined, 'it should...')

  unset(testData, 'a[b][0]')
  t.deepEqual(testData.a.b[0], undefined, 'it should...')

  unset(testData, 'a[b]')
  t.deepEqual(testData.a.b, undefined, 'it should...')

  const testDataB = deepClone(data)

  unset(testDataB, 'a[b][0][\'c\']')
  t.deepEqual(testDataB.a.b[0].c, undefined, 'it should...')

  unset(testDataB, 'a["b"][0]')
  t.deepEqual(testDataB.a.b[0], undefined, 'it should...')

  t.equal(unset(testDataB, 'a[b]'), true, 'it should....')
  t.equal(unset(testDataB, 'a[b][z]'), true, 'it should....')

  t.end()
})
