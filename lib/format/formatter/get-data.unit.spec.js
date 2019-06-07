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

test('When preprocessing an undefined value', t => {
  const value = preprocessMessageFormat(undefined, {})
  t.deepEqual(value, undefined, 'it should return undefined')
  t.end()
})

test('When preprocessing an emptty string', t => {
  const value = preprocessMessageFormat(undefined, {})
  t.deepEqual(value, undefined, 'it should return undefined')
  t.end()
})

test('When preprocessing a string containing an ordinary subsitution', t => {
  const processed = preprocessMessageFormat('{foo}', {})
  t.deepEqual(processed, {
    value: '{foo}',
    args: {}
  }, 'it should return the string and args unchanged')
  t.end()
})

test('When preprocessing a string containing a nested subsitution', t => {
  const data = {
    input: {
      foo: {
        bar: 'baz'
      }
    }
  }

  const value = preprocessMessageFormat('{foo.bar}', data)
  t.deepEqual(value, {
    value: '{__FORMATDATA__IDENTIFIER_foo__dot__bar}',
    args: {__FORMATDATA__IDENTIFIER_foo__dot__bar: 'baz'}
  }, 'it should return the updated value and args')
  t.end()
})

test('When preprocessing a string containing a nested subsitution that has no value', t => {
  const data = {}

  const value = preprocessMessageFormat('{foo.bar}', data)
  t.deepEqual(value, {
    value: '{__FORMATDATA__IDENTIFIER_foo__dot__bar}',
    args: {__FORMATDATA__IDENTIFIER_foo__dot__bar: undefined}
  }, 'it should return the updated value and args')
  t.end()
})

test('When preprocessing a string containing multiple nested subsitutions', t => {
  const data = {
    input: {
      foo: {
        bar: 'baz'
      },
      x: {
        y: 'z'
      }
    }
  }

  const value = preprocessMessageFormat('{foo.bar} {x.y}', data)
  t.deepEqual(value, {
    value: '{__FORMATDATA__IDENTIFIER_foo__dot__bar} {__FORMATDATA__IDENTIFIER_x__dot__y}',
    args: {
      __FORMATDATA__IDENTIFIER_foo__dot__bar: 'baz',
      __FORMATDATA__IDENTIFIER_x__dot__y: 'z'
    }
  }, 'it should return the updated value and args')
  t.end()
})

test('When preprocessing a string containing a nested subsitution within another messageformat substitution', t => {
  const data = {
    input: {
      foo: {
        bar: 'baz'
      }
    }
  }

  const value = preprocessMessageFormat('{foo, select, undefined{} other{{foo.bar}}}', data)
  t.deepEqual(value, {
    value: '{foo, select, undefined{} other{{__FORMATDATA__IDENTIFIER_foo__dot__bar}}}',
    args: {__FORMATDATA__IDENTIFIER_foo__dot__bar: 'baz'}
  }, 'it should return the updated value and args')
  t.end()
})

test('When preprocessing a string containing a nested subsitution within another nested substitution', t => {
  const data = {
    input: {
      foo: {
        bar: 'baz'
      }
    }
  }

  const value = preprocessMessageFormat('{foo.bar, select, undefined{} other{{foo.bar}}}', data)
  t.deepEqual(value, {
    value: '{__FORMATDATA__IDENTIFIER_foo__dot__bar, select, undefined{} other{{__FORMATDATA__IDENTIFIER_foo__dot__bar}}}',
    args: {__FORMATDATA__IDENTIFIER_foo__dot__bar: 'baz'}
  }, 'it should return the updated value and args')
  t.end()
})

test('When preprocessing a string containing an array item subsitution', t => {
  const data = {
    input: {
      foo: ['a', 'b', 'c', 'd']
    }
  }
  const value = preprocessMessageFormat('{foo[2]}', data)
  t.deepEqual(value, {
    value: '{__FORMATDATA__IDENTIFIER_foo__leftbracket__2__rightbracket__}',
    args: {__FORMATDATA__IDENTIFIER_foo__leftbracket__2__rightbracket__: 'c'}
  }, 'it should return the updated value and args')
  t.end()
})

test('When preprocessing a string containing a scoped subsitution', t => {
  const data = {
    foo: {
      bar: 'baz'
    }
  }

  const value = preprocessMessageFormat('{foo@bar}', data)
  t.deepEqual(value, {
    value: '{__FORMATDATA__SCOPE_foo__IDENTIFIER_bar}',
    args: {__FORMATDATA__SCOPE_foo__IDENTIFIER_bar: 'baz'}
  }, 'it should return the updated value and args')
  t.end()
})

test('When preprocessing a string containing an multiple extended substitutions', t => {
  const data = {
    input: {
      foo: ['a', 'b', 'foo[2]', 'd']
    },
    foo: {
      bar: 'foo@bar'
    },
    bar: {
      foo: {
        bar: ['bar@foo.bar[0]']
      }
    }
  }
  const value = preprocessMessageFormat('{foo@bar} : {bar@foo.bar[0]} : {bar} : {foo[2]}', data)
  t.deepEqual(value, {
    value: '{__FORMATDATA__SCOPE_foo__IDENTIFIER_bar} : {__FORMATDATA__SCOPE_bar__IDENTIFIER_foo__dot__bar__leftbracket__0__rightbracket__} : {bar} : {__FORMATDATA__IDENTIFIER_foo__leftbracket__2__rightbracket__}',
    args: {
      __FORMATDATA__SCOPE_foo__IDENTIFIER_bar: 'foo@bar',
      __FORMATDATA__SCOPE_bar__IDENTIFIER_foo__dot__bar__leftbracket__0__rightbracket__: 'bar@foo.bar[0]',
      __FORMATDATA__IDENTIFIER_foo__leftbracket__2__rightbracket__: 'foo[2]'
    }
  }, 'it should return the updated value and args')
  t.end()
})

test('When preprocessing a string containing escaped braces and no extended substitutions', t => {
  const input = "'{'save@foo'}' blah '{'save@bar'}'" // eslint-disable-line quotes
  const value = preprocessMessageFormat(input, {})
  t.deepEqual(value, {
    value: "'{'save@foo'}' blah '{'save@bar'}'", // eslint-disable-line quotes
    args: {}
  }, 'it should return undefined')
  t.end()
})

test('When preprocessing a string containing both escaped braces and extended substitutions', t => {
  const input = "{save@foo} blah '{'save@bar'}'" // eslint-disable-line quotes
  const value = preprocessMessageFormat(input, {})
  t.deepEqual(value, {
    value: '{__FORMATDATA__SCOPE_save__IDENTIFIER_foo} blah \'{\'save@bar\'}\'',
    args: {__FORMATDATA__SCOPE_save__IDENTIFIER_foo: undefined}
  }, 'it should return the updated value and args but leave the escaped braces intact')
  t.end()
})

test('When preprocessing a string with string aliases containing messageformat substitution', t => {
  const input = '[% {foo} %]'
  const value = preprocessMessageFormat(input, {})
  t.deepEqual(value, {
    value: '[% {foo} %]',
    args: {}
  }, 'it should return value and args unchanged')
  t.end()
})

test('When preprocessing a string with string aliases containing extended messageformat substitution', t => {
  const input = '[% {nested.prop} %]'
  const value = preprocessMessageFormat(input, data)
  t.deepEqual(value, {
    value: '[% {__FORMATDATA__IDENTIFIER_nested__dot__prop} %]',
    args: {
      __FORMATDATA__IDENTIFIER_nested__dot__prop: data.input['nested.prop']
    }
  }, 'it should return value and args unchanged')
  t.end()
})

test('When preprocessing a string with messageformat substitution containing string alias', t => {
  const input = '{foo, select, bar{[% foo.bar %]} other{}}'
  const value = preprocessMessageFormat(input, {})
  t.deepEqual(value, {
    value: '{foo, select, bar{[% foo.bar %]} other{}}',
    args: {}
  }, 'it should return value and args unchanged')
  t.end()
})

test('When preprocessing a string with extended messageformat substitution containing string alias', t => {
  const input = '{nested.prop, select, bar{[% foo.bar %]} other{{nested.prop}}}'
  const value = preprocessMessageFormat(input, data)
  t.deepEqual(value, {
    value: '{__FORMATDATA__IDENTIFIER_nested__dot__prop, select, bar{[% foo.bar %]} other{{__FORMATDATA__IDENTIFIER_nested__dot__prop}}}',
    args: {
      __FORMATDATA__IDENTIFIER_nested__dot__prop: data.input['nested.prop']
    }
  }, 'it should return value and args unchanged')
  t.end()
})
