const test = require('tape')

const {
  skipPage,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  skipComponents
} = require('./page')

test('When the module is loaded', function (t) {
  t.notEqual(skipPage, undefined, 'it should export the skipPage method')
  t.notEqual(processInput, undefined, 'it should export the processInput method')
  t.notEqual(validateInput, undefined, 'it should export the validateInput method')
  t.notEqual(formatProperties, undefined, 'it should export the formatProperties method')
  t.notEqual(updateControlNames, undefined, 'it should export the updateControlNames method')
  t.notEqual(skipComponents, undefined, 'it should export the skipComponents method')

  t.end()
})
