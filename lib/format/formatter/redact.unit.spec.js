const test = require('tape')

const formatRedact = require('./redact').redact

test('When redacting a string and passing no pattern', t => {
  const redacted = formatRedact('hello')
  t.equal(redacted, '*****', 'it should redact the string using the default pattern')
  t.end()
})

test('When redacting a string and passing a pattern', t => {
  const redacted = formatRedact('hello', {pattern: '#'})
  t.equal(redacted, '#####', 'it should redact the string using the pattern')
  t.end()
})

test('When redacting a string and passing characters to protect', t => {
  const redacted = formatRedact('hello', {protect: ['l']})
  t.equal(redacted, '**ll*', 'it should redact the string while protecting the specified characters')
  t.end()
})
