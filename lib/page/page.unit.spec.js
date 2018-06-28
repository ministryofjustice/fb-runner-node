const test = require('tape')

const {
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents
} = require('./page')

test('When the module is loaded', function (t) {
  t.notEqual(typeof validateInput, 'undefined', 'it should export the validateInput method')
  t.notEqual(typeof formatProperties, 'undefined', 'it should export the formatProperties method')
  t.notEqual(typeof updateControlNames, 'undefined', 'it should export the updateControlNames method')
  t.notEqual(typeof skipComponents, 'undefined', 'it should export the skipComponents method')

  t.end()
})
