const test = require('tape')
const path = require('path')
const shell = require('shelljs')

const jsonLoader = require('./load-json')

const path1 = path.resolve('data', 'source1')
const path2 = path.resolve('data', 'source2')
const pathUnreadable = path.resolve('data', 'sourceunreadable')
const pathInvalid = path.resolve('data', 'sourceinvalid')
const source1 = {
  source: 'source1',
  path: path1
}
const source2 = {
  source: 'source2',
  path: path2
}
const sourceUnreadable = {
  source: 'unreadable',
  path: pathUnreadable
}
const sourceInvalid = {
  source: 'invalid',
  path: pathInvalid
}
const nonexistentLocation = {
  source: 'nonexistentLocation',
  path: 'no/such/location'
}

const getSources = data => data.map(item => item.source)
const getDataIds = data => data.map(item => item.instances.map(json => json._id))

test('When loading the json', function (t) {
  t.plan(2)

  jsonLoader
    .load([source1])
    .then(data => {
      t.deepEquals(getSources(data), [
        'source1'
      ], 'returns the correct sources')

      t.deepEquals(getDataIds(data), [
        ['a', 'b', 'c']
      ], 'returns the correct data')
    })
})

test('When loading the json from multiple sources', function (t) {
  t.plan(2)

  jsonLoader
    .load([source1, source2])
    .then(data => {
      t.deepEquals(getSources(data), [
        'source1',
        'source2'
      ], 'returns the correct sources')

      t.deepEquals(getDataIds(data), [
        ['a', 'b', 'c'],
        ['a', 'd']
      ], 'returns the correct data')
    })
})

test('When no source property is passed', function (t) {
  t.plan(3)

  jsonLoader
    .load([{
      path: path1
    }])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'ENOSOURCE', 'returns ‘ENOSOURCE’')
      t.equals(e.message, 'No source specified', 'returns the correct message')
    })
})

test('When no path property is passed', function (t) {
  t.plan(3)

  jsonLoader
    .load([{
      source: 'source1'
    }])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'ENOPATH', 'returns ‘ENOPATH’')
      t.equals(e.message, 'No path specified', 'returns the correct message')
    })
})

test('When null is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load([null])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'EWRONGTYPE', 'returns ‘EWRONGTYPE’')
      t.equals(e.message, '"null" is not an object', 'returns the correct message')
    })
})

test('When undefined is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load([undefined])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'EWRONGTYPE', 'returns ‘EWRONGTYPE’')
      t.equals(e.message, '"undefined" is not an object', 'returns the correct message')
    })
})

test('When a string is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load(['/path'])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'EWRONGTYPE', 'returns ‘EWRONGTYPE’')
      t.equals(e.message, '"string" is not an object', 'returns the correct message')
    })
})

test('When a number is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load([2])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'EWRONGTYPE', 'returns ‘EWRONGTYPE’')
      t.equals(e.message, '"number" is not an object', 'returns the correct message')
    })
})

test('When an array is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load([['/path']])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'EWRONGTYPE', 'returns ‘EWRONGTYPE’')
      t.equals(e.message, '"array" is not an object', 'returns the correct message')
    })
})

test('When loading the json from a source that does not exist', function (t) {
  t.plan(3)

  jsonLoader
    .load([nonexistentLocation])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'EPATHDOESNOTEXIST', 'returns ‘EPATHDOESNOTEXIST’')
      t.equals(e.message, 'Path "no/such/location" not found', 'returns the correct message')
    })
})

test('When loading unreadable json', function (t) {
  t.plan(2)

  const unreadable = path.resolve(pathUnreadable, 'unreadable.json')
  shell.chmod('000', unreadable)

  jsonLoader
    .load([sourceUnreadable])
    .catch(e => {
      t.equals(e.name, 'Error', 'throws an Error')
      t.equals(e.code, 'EACCES', 'returns ‘ENOENT’')
    })
    .then(() => {
      // make file readable again
      shell.chmod('644', unreadable)
    })
})

test('When loading invalid json', function (t) {
  t.plan(2)

  jsonLoader
    .load([sourceInvalid])
    .catch(e => {
      t.equals(e.name, 'JSONError', 'throws an JSONError')
      t.equals(e.fileName, 'data/sourceinvalid/invalid.json', 'returns the invalid file path')
    })
})

test('When loading duplicate sources', function (t) {
  t.plan(3)

  jsonLoader
    .load([source1, source1])
    .catch(e => {
      t.equals(e.name, 'LoadJSONError', 'throws a LoadJSONError')
      t.equals(e.code, 'EDUPLICATESOURCES', 'returns ‘correct’')
      t.deepEquals(e.data, {
        sources: [
          'source1',
          'source1'
        ]
      }, 'returns the correct data')
    })
})
