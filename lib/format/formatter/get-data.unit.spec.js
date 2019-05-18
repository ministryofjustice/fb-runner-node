const test = require('tape')

const {getData, preprocessMessageFormat} = require('./get-data')

const data = {
  input: {
    prop: 'unscoped prop',
    'nested.prop': 'default scope nested prop'
  },
  foo: {
    prop: 'scoped prop',
    'nested.prop': 'scoped nested prop'
  }
}

test('When asking for a property in the default scopee', t => {
  const value = getData(data, null, 'identifier="prop"')
  t.equal(value, 'unscoped prop', 'it should return the property from the default scope')
  t.end()
})

test('When asking for a nested property', t => {
  const value = getData(data, null, 'identifier="nested.prop"')
  t.equal(value, 'default scope nested prop', 'it should return the nested property from the default scope')
  t.end()
})

test('When asking for a property in an explicit scope', t => {
  const value = getData(data, null, 'scope="foo" identifier="prop"')
  t.equal(value, 'scoped prop', 'it should return the property from the default scope')
  t.end()
})

test('When asking for a nested property in an explicit scope', t => {
  const value = getData(data, null, 'scope="foo" identifier="nested.prop"')
  t.equal(value, 'scoped nested prop', 'it should return the nested property from the default scope')
  t.end()
})

test('When asking for a property but no data is passed', t => {
  const value = getData(undefined, null, 'identifier="prop"')
  t.equal(value, undefined, 'it should return undefined')
  t.end()
})

test('When attempting to preprocess an undefined value', t => {
  const value = preprocessMessageFormat(undefined)
  t.equal(value, '', 'it should return an empty string')
  t.end()
})

test('When preprocessing a string containing an ordinary subsitution', t => {
  const value = preprocessMessageFormat('{foo}')
  t.equal(value, '{foo}', 'it should return the string unchanged')
  t.end()
})

test('When preprocessing a string containing a nested subsitution', t => {
  const value = preprocessMessageFormat('{foo.bar}')
  t.equal(value, '{_scopes, getData, identifier="foo.bar"}', 'it should replace the nested substitution with the corresponding formatter expression')
  t.end()
})

test('When preprocessing a string containing an array item subsitution', t => {
  const value = preprocessMessageFormat('{foo[2]}')
  t.equal(value, '{_scopes, getData, identifier="foo[2]"}', 'it should replace the array item substitution with the corresponding formatter expression')
  t.end()
})

test('When preprocessing a string containing a scoped subsitution', t => {
  const value = preprocessMessageFormat('{save@foo}')
  t.equal(value, '{_scopes, getData, scope="save" identifier="foo"}', 'it should replace the scoped substitution with the corresponding formatter expression')
  t.end()
})

test('When preprocessing a string containing a subsitution pointing to an explicit lang', t => {
  const value = preprocessMessageFormat('{foo:cy}')
  t.equal(value, '{_scopes, getData, lang="cy" identifier="foo"}', 'it should replace the substitution with the corresponding formatter expression')
  t.end()
})

test('When preprocessing a string containing escaped braces', t => {
  const input = "'{'save@foo'}' blah '{'save@bar'}'" // eslint-disable-line quotes
  const value = preprocessMessageFormat(input)
  t.equal(value, input, 'it should return the escaped braces unchanged')
  t.end()
})
