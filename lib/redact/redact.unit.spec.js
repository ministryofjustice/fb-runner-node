const test = require('tape')

const redact = require('./redact')

test('When not passed a pattern to redact against', t => {
  t.equal(redact('abcd', ''), 'abcd', 'it should return the value unchanged')
  t.end()
})

test('When passed a replacement string', t => {
  t.equal(redact('abcd', '', {replacement: 'REDACTED'}), 'REDACTED', 'it should return the replacement string')
  t.equal(redact('abcd', '\'ZAPPED\'', {replacement: 'REDACTED'}), 'ZAPPED', 'it should return any replacement string passed via the pattern instead of any passed as part of the options')
  t.end()
})

test('When redacting unfixed length values', t => {
  t.equal(redact('', '*+'), '', 'it should leave empty values unchanged')
  t.equal(redact('abcd', '*+'), '****', 'it should redact the value')
  t.equal(redact('abcd', '#+'), '####', 'it should redact the value using an replacement character specified')
  t.equal(redact('abcdefg', '*+'), '*******', 'it should redact the value')

  t.equal(redact('abcd', '*'), '****', 'it should redact the value using the shorthand')
  t.equal(redact('abcd', '#'), '####', 'it should redact the value using the shorthand for the replacement character specified')

  t.end()
})

test('When redacting fixed length values', t => {
  t.equal(redact('', 'a--a'), '', 'it should leave empty values unchanged')
  t.equal(redact('abcd', 'a--a'), 'a--d', 'it should redact the value leaving specified character slots unchanged')
  t.equal(redact('abcd', 'a-a'), '****', 'it should redact the value entirely using the default character if the string is shorter the fixed length pattern')
  t.end()
})

test('When redacting unfixed length values containing specific character instructions', t => {
  t.equal(redact('abcd', 'aa*+'), 'ab**', 'it should handle alphabetical chars followed by any number of redacted chars')
  t.equal(redact('abcd', '*+aa'), '**cd', 'it should handle any number of redacted chars followed by alphabetical chars')
  t.equal(redact('abcd', 'a*+a'), 'a**d', 'it should handle alphabetical chars surrounding any number of redacted chars')

  t.equal(redact('1234', '00*+'), '12**', 'it should handle numerical chars followed by any number of redacted chars')
  t.equal(redact('1234', '*+00'), '**34', 'it should handle any number of redacted chars followed by numerical chars')
  t.equal(redact('1234', '0*+0'), '1**4', 'it should handle numerical chars surrounding any number of redacted chars')

  t.equal(redact('a123', 'a0*+'), 'a1**', 'it should handle alphbetical and numerical characters followed by any number of redacted chars')

  t.equal(redact('abcdef', '??*+'), 'ab****', 'it should handle a specific number of any characters followed by any number of redacted chars')

  t.equal(redact('a2c4', '?+**'), 'a2**', 'it should handle any number of unredacted characters followed by a specific number of redacted characters')
  t.end()
})

test('When redacting values with multiple replacement characters', t => {
  t.equal(redact('ab1d3f', '##?+*'), '##1d3*', 'it should handle multiple instances of specific numbers of replacement chars')
  t.equal(redact('ab1d3f', '##?+*'), '##1d3*', 'it should handle mixed instances of specific numbers of and any number of replacement chars')
  t.equal(redact('ab1d3f', '##0+a*+'), '##1d**', 'it should handle mixed instances of specific numbers of and any number of replacement chars combined with specific character instructions')
  t.end()
})

test('When redacting values and specifying a minimum number of characters to return', t => {
  t.equal(redact('', '*+', {minChars: 8}), '********', 'it should return the minimum number of redacted characters if the value is empty')
  t.equal(redact('ab', '*+', {minChars: 8}), '********', 'it should return the minimum number of redacted characters if the value is too short')
  t.equal(redact('', '#+', {minChars: 8}), '########', 'it should return the minimum number of redacted characters if the value is empty and an alternative redacted character is used')
  t.equal(redact('ab', '#+', {minChars: 8}), '########', 'it should return the minimum number of redacted characters if the value is too short and an alternative redacted character is used')

  t.equal(redact('ab', 'a+', {minChars: 8}), 'ab******', 'it should pad the result with the minimum number of redacted characters if the value is too short respecting any non-redacted chars')

  t.equal(redact('abcdefgh', '*******a', {minChars: 8}), '*******h', 'it should respect the fixed length pattern if the value has as many characters as specified as the minimum nummber of characters')
  t.equal(redact('ab', '*******a', {minChars: 8}), '********', 'it should not respect the fixed length pattern if the value has less characters than specified as the minimum nummber of characters')
  t.end()
})

test('When redacting values containing characters that should be protected', t => {
  t.equal(redact('ab\ncd', '*+'), '**\n**', 'it should not redact line breaks')
  t.equal(redact('ab-c-d', 'aa*+', {protect: ['-']}), 'ab-*-*', 'it should not redact the characters flagged as protected')
  t.equal(redact('a-b-c-d', 'aa*+', {protect: ['-']}), 'a-*-*-*', 'it should not redact the characters flagged as protected')
  t.end()
})

test('When redacting values with complex patterns', t => {
  t.equal(redact('az1bb', 'a+0*+'), 'az1**', 'it should handle alphabetical characters followed by a number and any number of redacted characters')
  t.equal(redact('az1xd3bb', 'a+0*+'), 'az1*****', 'it should handle alphabetical characters followed by a number and any number of redacted characters - test 2')

  t.equal(redact('az1bb', '*+0a+'), '**1bb', 'it should handle any number of redacted characters followed by a number and alphabetical characters')
  t.equal(redact('az345c1bb', '*+0a+'), '******1bb', 'it should handle any number of redacted characters followed by a number and alphabetical characters - test 2')

  t.equal(redact('abc1234defgh', 'a+0+*+'), 'abc1234*****', 'it should handle alphabetical characters followed by numbers and any number of redacted characters')
  t.end()
})

test('When redacting values against an "impossible/ambiguous" pattern', t => {
  t.equal(redact('abcdef', '*+0*+'), '******', 'it should ignore specific non-redactions sandwiched between 2 blocks of any number of redacted characters')
  t.equal(redact('abcdef', 'a*+0*+'), 'a*****', 'it should ignore specific non-redactions sandwiched between 2 blocks of any number of redacted characters embedded in a larger pattern')
  t.equal(redact('abcdef', '*+0*+a'), '*****f', 'it should ignore specific non-redactions sandwiched between 2 blocks of any number of redacted characters embedded in a larger pattern - test 2')

  t.equal(redact('abcdef', '0+'), '******', 'it should redact any character that cannot be matched against the pattern')
  t.equal(redact('abcdef', '0+', {character: '~'}), '~~~~~~', 'it should redact any character that cannot be matched against the pattern using the value passed for redaction character')

  t.equal(redact('abcdef', '0+a'), '*****f', 'it should not redact any character than can be unambiguously matched against the pattern')

  // this could output '##1***', '##1d**' or '##1d3*', but to prevent ambiguity, '##****'
  t.equal(redact('ab1d3f', '##?+*+'), '##****', 'it should redact any number of any chars when followed by an instruction to redact any number of characters')
  // this could output '##1***' or '##1d3*', but to prevent ambiguity, '##****'
  t.equal(redact('ab1d3f', '##?+0*+'), '##****', 'it should redact any number of any chars when followed by a specific character typed and then an instruction to redact any number of characters - test 1')
  t.equal(redact('ab1d3f4g', '##?+0*+'), '##******', 'it should redact any number of any chars when followed by a specific character typed and then an instruction to redact any number of characters - test 2')

  t.equal(redact('ab1d3f', '##*+?+'), '##****', 'it should redact any number of any chars when preceded by an instruction to redact any number of characters')
  t.equal(redact('ab1d3f', '##*+0?+'), '##****', 'it should redact any number of any chars when preceded by a specific character typed preceded by an instruction to redact any number of characters - test 1')
  t.equal(redact('ab1d3f4g', '##*+0?+'), '##******', 'it should redact any number of any chars when preceded by a specific character typed and preceded by an instruction to redact any number of characters - test 2')

  t.end()
})
