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
      ], 'it should return the correct sources')

      t.deepEquals(getDataIds(data), [
        ['a', 'b', 'c']
      ], 'it should return the correct data')
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
      ], 'it should return the correct sources')

      t.deepEquals(getDataIds(data), [
        ['a', 'b', 'c'],
        ['a', 'd']
      ], 'it should return the correct data')
    })
})

test('When no source property is passed', function (t) {
  t.plan(3)

  jsonLoader
    .load([{
      path: path1
    }])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw an JSONLoadError object')
      t.equals(e.code, 'ENOSOURCE', 'it should return the ENOSOURCE code')
      t.equals(e.message, 'No source specified', 'it should return the correct message')
    })
})

test('When no path property is passed', function (t) {
  t.plan(3)

  jsonLoader
    .load([{
      source: 'source1'
    }])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw an JSONLoadError object')
      t.equals(e.code, 'ENOPATH', 'it should return the ENOPATH code')
      t.equals(e.message, 'No path specified', 'it should return the correct message')
    })
})

test('When null is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load([null])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw an JSONLoadError object')
      t.equals(e.code, 'EWRONGTYPE', 'it should return the EWRONGTYPE code')
      t.equals(e.message, 'null passed instead of an object', 'it should return the correct message')
    })
})

test('When undefined is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load([undefined])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw an JSONLoadError object')
      t.equals(e.code, 'EWRONGTYPE', 'it should return the EWRONGTYPE code')
      t.equals(e.message, 'undefined passed instead of an object', 'it should return the correct message')
    })
})

test('When a string is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load(['/path'])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw an JSONLoadError object')
      t.equals(e.code, 'EWRONGTYPE', 'it should return the EWRONGTYPE code')
      t.equals(e.message, 'string passed instead of an object', 'it should return the correct message')
    })
})

test('When a number is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load([2])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw an JSONLoadError object')
      t.equals(e.code, 'EWRONGTYPE', 'it should return the EWRONGTYPE code')
      t.equals(e.message, 'number passed instead of an object', 'it should return the correct message')
    })
})

test('When an array is passed instead of a source object', function (t) {
  t.plan(3)

  jsonLoader
    .load([['/path']])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw an JSONLoadError object')
      t.equals(e.code, 'EWRONGTYPE', 'it should return the EWRONGTYPE code')
      t.equals(e.message, 'array passed instead of an object', 'it should return the correct message')
    })
})

test('When loading the json from a source that does not exist', function (t) {
  t.plan(3)

  jsonLoader
    .load([nonexistentLocation])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw a JSONLoadError object')
      t.equals(e.code, 'EPATHDOESNOTEXIST', 'it should return the EPATHDOESNOTEXIST code')
      t.equals(e.message, 'no/such/location does not exist', 'it should return the correct message')
    })
})

test('When loading unreadable json', function (t) {
  t.plan(2)

  const unreadable = path.resolve(pathUnreadable, 'unreadable.json')
  shell.chmod('000', unreadable)

  jsonLoader
    .load([sourceUnreadable])
    .catch(e => {
      t.equals(e.name, 'Error', 'it should throw an Error object')
      t.equals(e.code, 'EACCES', 'it should return the ENOENT code')
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
      t.equals(e.name, 'JSONError', 'it should throw an JSONError object')
      t.equals(e.fileName, 'data/sourceinvalid/invalid.json', 'it should return the invalid file path')
    })
})

test('When loading duplicate sources', function (t) {
  t.plan(3)

  jsonLoader
    .load([source1, source1])
    .catch(e => {
      t.equals(e.name, 'JSONLoadError', 'it should throw an JSONLoadError object')
      t.equals(e.code, 'EDUPLICATESOURCES', 'it should return the correct code')
      t.deepEquals(e.data, {
        sources: [
          'source1',
          'source1'
        ]
      }, 'it should return the correct data')
    })
})
