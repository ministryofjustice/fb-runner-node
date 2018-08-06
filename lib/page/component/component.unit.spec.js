const test = require('tape')

const {
  date
} = require('./component')

test('When the module is loaded', function (t) {
  t.notEqual(date, undefined, 'it should export the date controller')

  t.end()
})
