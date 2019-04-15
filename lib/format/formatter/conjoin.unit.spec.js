const test = require('tape')

const {conjoin} = require('./conjoin')

test('When conjoining a string value', t => {
  const formattedString = conjoin('a')
  t.equal(formattedString, 'a', 'it should return the value as is')
  t.end()
})

test('When conjoining more than 2 values', t => {
  const formattedString = conjoin(['a', 'b', 'c'])
  t.equal(formattedString, 'a, b and c', 'it should insert ‘commas’ and ‘and’ parts')
  t.end()
})

test('When conjoining 2 values', t => {
  const formattedString = conjoin(['a', 'b'])
  t.equal(formattedString, 'a and b', 'it should omit ‘commas’ when necessary')
  t.end()
})

test('When conjoining a single value', t => {
  const formattedString = conjoin(['a'])
  t.equal(formattedString, 'a', 'it should omit ‘and’ when necessary')
  t.end()
})

test('When reversing conjoined values', t => {
  const formattedString = conjoin(['a', 'b', 'c'], {reverse: true})
  t.equal(formattedString, 'c, b and a', 'it should reverse the values')
  t.end()
})

test('When conjoining with a custom ‘and’ part', t => {
  const formattedString = conjoin(['a', 'b', 'c'], {and: ' und '})
  t.equal(formattedString, 'a, b und c', 'it should use the custom ‘and’')
  t.end()
})

test('When conjoining with a custom comma part', t => {
  const formattedString = conjoin(['a', 'b', 'c'], {comma: ' :: '})
  t.equal(formattedString, 'a :: b and c', 'it should use the custom comma')
  t.end()
})
