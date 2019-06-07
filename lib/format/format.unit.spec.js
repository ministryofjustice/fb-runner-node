const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')
const serviceData = {
  getInstanceLangProperty: () => {}
}
const getInstanceLangPropertyStub = stub(serviceData, 'getInstanceLangProperty')
const route = require('../route/route')
const getUrlStub = stub(route, 'getUrl')
const {format} = proxyquire('./format', {
  '../service-data/service-data': serviceData,
  '../route/route': route
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

test('When formatting a string for a specific language that has been configured', t => {
  const formatted = format('{x}', {x: 'value'}, {lang: 'cy'})
  t.equal(formatted, 'value', 'it should return the subsituted value')
  t.end()
})

test('When formatting a string for a specific language that has not been configured', t => {
  const formatted = format('{x}', {x: 'value'}, {lang: 'fr'})
  t.equal(formatted, 'value', 'it should return the subsituted value')
  t.end()
})

test('When formatting a string that resolves to an empty string', t => {
  const formatted = format('{x}', {x: ''})
  t.equal(formatted, '', 'it should return an empty string')
  t.end()
})

test('When formatting a string that contains a scoped substitution', t => {
  const formatted = format('{foo@x}', {
    x: 'unscoped x',
    _scopes: {
      foo: {
        x: 'scoped x'
      }
    }
  })
  t.equal(formatted, 'scoped x', 'it should return the scoped value')
  t.end()
})

test('When formatting a string that contains a scoped substitution but the scope does not exist', t => {
  const formatted = format('{bar@x}', {
    x: 'unscoped x'
  })
  t.equal(formatted, undefined, 'it should return undefined')
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

test('When formatting a string containing a redaction instruction', t => {
  const formattedString = format('Unredacted {x, redact}', {x: 'hello'})
  t.equal(formattedString, 'Unredacted *****', 'it should redact the value in the string')

  const formattedStringWithArgs = format('{x, redact, pattern="#"}', {x: 'hello'})
  t.equal(formattedStringWithArgs, '#####', 'it should redact the value in the string using any redaction args passed')
  t.end()
})

test('When formatting a string containing redacted values', t => {
  const formattedStringAsterisks = format('Value {x}\r\n\r\n{x, redact}', {x: 'hello'}, {multiline: true})
  t.equal(formattedStringAsterisks, '<p>Value hello</p>\n<p>*****</p>', 'it should not turn asterisk redactions into hr tags')

  const formattedStringHashes = format('Value {x}\r\n\r\n{x, redact, pattern="#"}', {x: 'hello'}, {multiline: true})
  t.equal(formattedStringHashes, '<p>Value hello</p>\n<p>#####</p>', 'it should not turn hash redactions into heading tags')

  const formattedStringMultiline2 = format('Value {x} {x, redact}\r\n\r\n{x, redact}\r\n\r\n {x, redact, pattern="#"} \r\n\r\nEnds', {x: 'hello'}, {multiline: true})
  t.equal(formattedStringMultiline2, '<p>Value hello *****</p>\n<p>*****</p>\n<p>#####</p>\n<p>Ends</p>', 'it should not turn assorted redactions into html markup')
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

test('When formatting a string for an explicit lang', t => {
  getInstanceLangPropertyStub.resetHistory()
  const formatted = format('[% foo %]', {}, {lang: 'cy'}) // eslint-disable-line no-unused-vars
  t.deepEqual(getInstanceLangPropertyStub.getCall(0).args, ['foo', 'value', 'cy'], 'it should pass the lang to the instance property lookup')
  getInstanceLangPropertyStub.restore()
  t.end()
})

test('When formatting a string for an explicit lang that has not been configured', t => {
  getInstanceLangPropertyStub.resetHistory()
  const formatted = format('[% foo %]', {}, {lang: 'fr'}) // eslint-disable-line no-unused-vars
  t.deepEqual(getInstanceLangPropertyStub.getCall(0).args, ['foo', 'value', 'fr'], 'it should pass the lang to the instance property lookup anyway')
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

test('When formatting a string referencing a url by instance id', t => {
  getUrlStub.resetHistory()
  getUrlStub.callsFake(() => '/foo')

  const formatted = format('[% url:foo %]', {})
  t.equal(formatted, '/foo', 'it should return the url')

  getUrlStub.restore()
  t.end()
})

test('When formatting a string referencing a url by instance id and passing parameters', t => {
  getUrlStub.resetHistory()
  getUrlStub.callsFake((_id) => '/foo/:bar')

  format('[% url:foo bar="baz" %]')
  const callArgs = getUrlStub.getCall(0).args
  t.deepEqual(callArgs, ['foo', {bar: 'baz'}, undefined], 'it should pass those parameters to getUrl')

  getUrlStub.restore()
  t.end()
})

test('When formatting a string referencing a fully qualified url by instance id', t => {
  getUrlStub.resetHistory()
  getUrlStub.callsFake(() => '/foo')
  const formatted = format('[% fqdn:foo %]', {})
  const FQDN = route.getFullyQualifiedUrl()
  t.equal(formatted, `${FQDN}/foo`, 'it should return the url')

  getUrlStub.restore()
  t.end()
})

test('When formatting a string containing a nested string with an invalid prefix', t => {
  const formatted = format('[% bar:foo %]', {})
  t.equal(formatted, '[% bar:foo %]', 'it should leave the nested string untouched')

  t.end()
})
