const test = require('tape')

const bytes = require('bytes')
const formatBytes = require('./bytes')

const getFormattedSize = (size) => {
  return formatBytes(bytes(size))
}

test('When formatting files sizes', t => {
  t.equal(getFormattedSize('19MB'), '19MB', 'it should return exact MB values without decimal points')
  t.equal(getFormattedSize('19.77MB'), '19.8MB', 'it should round up MB values to the nearest decimal point')
  t.equal(getFormattedSize('19.71MB'), '19.7MB', 'it should round down MB values to the nearest decimal point')
  t.equal(getFormattedSize('19.97MB'), '20MB', 'it should round up MB values to the next integer')
  t.equal(getFormattedSize('19.03MB'), '19MB', 'it should round down MB values to the next integer')
  t.equal(getFormattedSize('19.8KB'), '20KB', 'it should round up KB values to the next integer')
  t.equal(getFormattedSize('19.3KB'), '19KB', 'it should round down KB values to the next integer')
  t.equal(getFormattedSize('19B'), '19B', 'it should B values exactly')

  t.end()
})

test('When formatting files sizes passed as strings', t => {
  t.equal(formatBytes('19.71MB'), '19.71MB', 'it should return the value as is')
  t.end()
})
