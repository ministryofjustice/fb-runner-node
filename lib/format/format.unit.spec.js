const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')
const serviceData = {
  getInstanceLangProperty: () => {}
}
const getInstanceLangPropertyStub = stub(serviceData, 'getInstanceLangProperty')

const {format} = proxyquire('./format', {
  '../service-data/service-data': serviceData
})

test('When formatting an undefined value', t => {
  const formatted = format()
  t.equal(formatted, undefined, 'it should return the same value')
  t.end()
})

test('When formatting a number', t => {
  const formatted = format(3)
  t.equal(formatted, 3, 'it should return the same value')
  t.end()
})

test('When formatting a string which does not have any substitutions', t => {
  const formatted = format('value')
  t.equal(formatted, 'value', 'it should return the same value')
  t.end()
})

test('When formatting a string containing a subsitution', t => {
  const formatted = format('{x}', {x: 'value'})
  t.equal(formatted, 'value', 'it should return the subsituted value')
  t.end()
})

test('When formatting a string and the substitution option is false', t => {
  const formatted = format('{x}', {x: 'value'}, {substitution: false})
  t.equal(formatted, '{x}', 'it should return the same value')
  t.end()
})

test('When formatting a string which contains markdown instructions', t => {
  const formatted = format('*value*')
  t.equal(formatted, '<em>value</em>', 'it should return the value transformed by markdown')
  t.end()
})

test('When formatting a string which contains a substitution and markdown instructions', t => {
  const formatted = format('*{x}*', {x: 'value'})
  t.equal(formatted, '<em>value</em>', 'it should return the value with the substitution and transformed by markdown')
  t.end()
})

test('When formatting a string and the markdown option is false', t => {
  const formatted = format('*value*', null, {markdown: false})
  t.equal(formatted, '*value*', 'it should return the value as is')
  t.end()
})

test('When formatting a multiline string which does not have any substitutions', t => {
  const formatted = format('value', null, {multiline: true})
  t.equal(formatted, '<p>value</p>', 'it should return the value wrapped in a ’p’ element')
  t.end()
})

test('When formatting a string containing a concat substitution', t => {
  const formattedString = format('{x, concat}', {x: 'a'})
  t.equal(formattedString, 'a', 'it should return value as is if not passed an array')

  const formatted3 = format('{x, concat}', {x: ['a', 'b', 'c']})
  t.equal(formatted3, 'a, b and c', 'it should insert ‘commas’ and ‘and’ parts')

  const formatted2 = format('{x, concat}', {x: ['a', 'b']})
  t.equal(formatted2, 'a and b', 'it should omit ‘commas’ when necessary')

  const formatted1 = format('{x, concat}', {x: ['a']})
  t.equal(formatted1, 'a', 'it should omit ‘and’ when necessary')

  const formattedReverse = format('{x, concat, reverse}', {x: ['a', 'b', 'c']})
  t.equal(formattedReverse, 'c, b and a', 'it should reverse the items when passed')

  const formattedAnd = format('{x, concat, and=" und "}', {x: ['a', 'b', 'c']})
  t.equal(formattedAnd, 'a, b und c', 'it should use custom ‘and’ when passed')

  const formattedComma = format('{x, concat, comma=" ;; "}', {x: ['a', 'b', 'c']})
  t.equal(formattedComma, 'a ;; b and c', 'it should use custom ‘comma’ when passed')

  const formattedAndComma = format('{x, concat, and=" und "&comma=" ;; "}', {x: ['a', 'b', 'c']})
  t.equal(formattedAndComma, 'a ;; b und c', 'it should use custom ‘and’ and ‘comma’ when passed')

  t.end()
})

test('When formatting a string which contains a nested string', t => {
  getInstanceLangPropertyStub.resetHistory()
  getInstanceLangPropertyStub.callsFake(() => 'bar')
  const formatted = format('[% foo %]')
  t.deepEqual(getInstanceLangPropertyStub.getCall(0).args, ['foo', 'value', undefined], 'it should use the value property for the string lookup')
  t.equal(formatted, 'bar', 'it should return the nested string')
  getInstanceLangPropertyStub.restore()
  t.end()
})

test('When formatting a string which contains a nested string which itself contains a nested string', t => {
  getInstanceLangPropertyStub.resetHistory()
  getInstanceLangPropertyStub.callsFake((x) => {
    const values = {
      foo: '[% bar %]',
      bar: 'baz'
    }
    return values[x]
  })
  const formatted = format('[% foo %]')
  t.equal(formatted, 'baz', 'it should return the nested string')

  getInstanceLangPropertyStub.restore()
  t.end()
})

test('When formatting a string which contains a nested string with arguments', t => {
  getInstanceLangPropertyStub.resetHistory()
  getInstanceLangPropertyStub.callsFake(() => {
    return 'Hello {bar} {count, select, 1{one} 2{two} other{other}} {boolean} {f}'
  })
  const formatted = format('[% foo bar="baz" boolean f=false count=2 %]')
  t.equal(formatted, 'Hello baz two true false', 'it should return the nested string processed with the args')

  getInstanceLangPropertyStub.restore()
  t.end()
})

test('When formatting a string which contains a nested string referencing an explicit property', t => {
  getInstanceLangPropertyStub.resetHistory()
  getInstanceLangPropertyStub.callsFake(() => {})

  format('[% foo#bar %]')
  t.deepEqual(getInstanceLangPropertyStub.getCall(0).args, ['foo', 'bar', undefined], 'it should use the explicit property to retrieve the referenced string')

  getInstanceLangPropertyStub.restore()
  t.end()
})

test('When formatting a string containing a nested string which does not exist', t => {
  getInstanceLangPropertyStub.resetHistory()
  getInstanceLangPropertyStub.callsFake(() => {})
  const formatted = format('[% foo %]')
  t.equal(formatted, '', 'it should return an empty string')

  getInstanceLangPropertyStub.restore()
  t.end()
})

test('When formatting a string containing a nested string which does not exist and a fallback value has been provided', t => {
  getInstanceLangPropertyStub.resetHistory()
  getInstanceLangPropertyStub.callsFake(() => {})
  const formatted = format('[% foo %]', {}, {fallback: 'fallback value'})
  t.equal(formatted, 'fallback value', 'it should return the fallback value')

  getInstanceLangPropertyStub.restore()
  t.end()
})
