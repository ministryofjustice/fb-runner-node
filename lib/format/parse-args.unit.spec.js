const test = require('tape')

const parseArgs = require('./parse-args')

test('When parsing an undefined value', t => {
  const args = parseArgs()
  t.deepEqual(args, {}, 'it should return an empty object')
  t.end()
})

test('When parsing an empty string', t => {
  const args = parseArgs('')
  t.deepEqual(args, {}, 'it should return an empty object')
  t.end()
})

test('When parsing a property delimited with double quotes', t => {
  const args = parseArgs('foo="bar"')
  t.deepEqual(args, {foo: 'bar'}, 'it should return the correct property')
  t.end()
})

test('When parsing a property delimited with single quotes', t => {
  const args = parseArgs('foo=\'bar\'')
  t.deepEqual(args, {foo: 'bar'}, 'it should return the correct property')
  t.end()
})

test('When parsing a number property', t => {
  const args = parseArgs('foo=3')
  t.deepEqual(args, {foo: 3}, 'it should return the property as a number')
  t.end()
})

test('When parsing a string property which is a number', t => {
  const args = parseArgs('foo="3"')
  t.deepEqual(args, {foo: '3'}, 'it should return the property as a string')
  t.end()
})

test('When parsing a boolean property', t => {
  const args = parseArgs('foo=true')
  t.deepEqual(args, {foo: true}, 'it should return the property as true')
  t.end()
})

test('When parsing a negative boolean property', t => {
  const args = parseArgs('foo=false')
  t.deepEqual(args, {foo: false}, 'it should return the property as false')
  t.end()
})

test('When parsing a string property that looks like a boolean', t => {
  const args = parseArgs('foo="true"')
  t.deepEqual(args, {foo: 'true'}, 'it should return the property as string')
  t.end()
})

test('When parsing a standalone property', t => {
  const args = parseArgs('foo')
  t.deepEqual(args, {foo: true}, 'it should return the property as true')
  t.end()
})

test('When parsing an empty property', t => {
  const args = parseArgs('foo=""')
  t.deepEqual(args, {foo: ''}, 'it should return the property as an empty string and not as true')
  t.end()
})
