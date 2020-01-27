const test = require('tape')

const cloneDeep = require('lodash.clonedeep')

const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('./bracket-notation-path')

const data = {
  a: {
    b: [{
      c: true
    }, {
      c: false
    }],
    empty: {
      string: '',
      number: 0
    }
  }
}

test('When getting the value of a path', t => {
  const testData = cloneDeep(data)

  t.deepEqual(getBracketNotationPath(testData, 'a[b]'), [{ c: true }, { c: false }], 'it should handle paths containing brackets without quotes')
  t.deepEqual(getBracketNotationPath(testData, 'a["b"]'), [{ c: true }, { c: false }], 'it should handle paths containing brackets with double quotes')
  t.deepEqual(getBracketNotationPath(testData, 'a[\'b\']'), [{ c: true }, { c: false }], 'it should handle paths containing brackets with single quotes')
  t.deepEqual(getBracketNotationPath(testData, 'a[b][0]'), { c: true }, 'it should handle array items - paths containing brackets with numeric values')
  t.deepEqual(getBracketNotationPath(testData, 'a[b][0][c]'), true, 'it should handle paths containing properties of array items')
  t.deepEqual(getBracketNotationPath(testData, 'a[d]'), undefined, 'it should handle paths that evaluate to undefined')
  t.deepEqual(getBracketNotationPath(testData, 'a[d]', 'default value'), 'default value', 'it should return a default value when requested for undefined values')
  t.deepEqual(getBracketNotationPath(testData, 'a[empty][string]', 'default value'), '', 'it should not return a default value when result is an empty string')
  t.deepEqual(getBracketNotationPath(testData, 'a[empty][number]', 'default value'), 0, 'it should not return a default value when result is zero')
  t.end()
})

test('When setting the value of a path', t => {
  const testData = cloneDeep(data)

  const setUndefined = setBracketNotationPath(testData, 'a[d]', 'value')
  t.deepEqual(getBracketNotationPath(testData, 'a[d]'), 'value', 'it should return the value that has been set')
  t.deepEqual(setUndefined, 'value', 'it should handle paths containing brackets without quotes')

  setBracketNotationPath(testData, 'a["z"]', 'value')
  t.deepEqual(testData.a.z, 'value', 'it should handle paths containing brackets with double quotes')

  setBracketNotationPath(testData, 'a[\'y\']', 'value')
  t.deepEqual(testData.a.y, 'value', 'it should handle paths containing brackets with single quotes')

  setBracketNotationPath(testData, 'a[b][0][c]', false)
  t.deepEqual(testData.a.b[0].c, false, 'it should handle paths containing properties of array items')

  setBracketNotationPath(testData, 'a[b][0]', { e: true, f: [1, 2] })
  t.deepEqual(testData.a.b[0], { e: true, f: [1, 2] }, 'it should handle array items - paths containing brackets with numeric values')

  setBracketNotationPath(testData, 'a[b][0][c]', true)
  t.deepEqual(testData.a.b[0].c, true, 'it should handle paths where the intervening properties need to be created')

  setBracketNotationPath(testData, 'a["b"][0][\'c\']', false)
  t.deepEqual(testData.a.b[0].c, false, 'it should handle paths containing brackets with single quotes')

  t.end()
})

test('When unsetting the value of a path', t => {
  const testData = cloneDeep(data)

  unsetBracketNotationPath(testData, 'a[b][0][c]')
  t.deepEqual(testData.a.b[0].c, undefined, 'it should handle paths containing properties of array items')

  unsetBracketNotationPath(testData, 'a[b][0]')
  t.deepEqual(testData.a.b[0], undefined, 'it should handle array items - paths containing brackets with numeric values')

  unsetBracketNotationPath(testData, 'a[b]')
  t.deepEqual(testData.a.b, undefined, 'it should handle paths containing brackets without quotes')

  const testDataB = cloneDeep(data)

  unsetBracketNotationPath(testDataB, 'a[b][0][\'c\']')
  t.deepEqual(testDataB.a.b[0].c, undefined, 'it should handle paths containing brackets with single quotes')

  unsetBracketNotationPath(testDataB, 'a["b"][0]')
  t.deepEqual(testDataB.a.b[0], undefined, 'it should handle paths containing brackets with double quotes')

  t.equal(unsetBracketNotationPath(testDataB, 'a[z][z]'), true, 'it should handle paths that evaluate to undefined')

  t.end()
})
