const test = require('tape')

const formatDate = require('./date').date

test('When formatting short ISO date strings', t => {
  const formattedStringISOShort = formatDate('2018-12-03')
  t.equal(formattedStringISOShort, '3 December 2018', 'it should return the correctly formatted string')
  t.end()
})

test('When formatting ISO date strings', t => {
  const formattedStringISO = formatDate('2018-12-03T21:26:25.761Z')
  t.equal(formattedStringISO, '3 December 2018', 'it should return the correctly formatted string')
  t.end()
})

test('When formatting YYYY/MM/DD date strings', t => {
  const formattedString = formatDate('2018/12/3')
  t.equal(formattedString, '3 December 2018', 'it should return the correctly formatted string')
  t.end()
})

test('When formatting date objects', t => {
  const formattedStringDateObj = formatDate(new Date('2018/12/3'))
  t.equal(formattedStringDateObj, '3 December 2018', 'it should return the correctly formatted string')
  t.end()
})

test('When formatting dates with a specific format', t => {
  const formattedStringDateObj = formatDate(new Date('2018/12/3'), {format: 'YY/DD/MM'})
  t.equal(formattedStringDateObj, '18/03/12', 'it should return the correctly formatted string')
  t.end()
})
