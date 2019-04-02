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

test('When formatting a string containing a conjoin substitution', t => {
  const formattedString = format('{x, and}', {x: ['a', 'b', 'c']})
  t.equal(formattedString, 'a, b and c', 'it should insert ‘commas’ and ‘and’ parts')

  const formattedReverse = format('{x, and, reverse}', {x: ['a', 'b', 'c']})
  t.equal(formattedReverse, 'c, b and a', 'it should reverse the items when passed')

  const formattedAnd = format('{x, and, and=" und "}', {x: ['a', 'b', 'c']})
  t.equal(formattedAnd, 'a, b und c', 'it should use custom ‘and’ when passed')

  const formattedSingle = format('{x, and}', {x: 'a'})
  t.equal(formattedSingle, 'a', 'it should handle strings')

  t.end()
})

test('When formatting a string containing a date substitution', t => {
  const formattedString = format('{x, date}', {x: new Date('2018/12/3')})
  t.equal(formattedString, '3 December 2018', 'it should format date objects')

  const formattedStringFormat = format('{x, date, format="YY/DD/MM"}', {x: new Date('2018/12/3')})
  t.equal(formattedStringFormat, '18/03/12', 'it should format date objects')
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
