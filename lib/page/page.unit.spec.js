const test = require('tape')

const pageMethods = require('./page')
const {
  skipPage,
  setComposite,
  setControlNames,
  setRepeatable,
  setMultipartForm,
  processUploads,
  setUploads,
  processInput,
  validateInput,
  formatProperties,
  updateControlNames,
  setService,
  skipComponents,
  kludgeUpdates,
  components
} = pageMethods

test('When the module is loaded', function (t) {
  t.notEqual(skipPage, undefined, 'it should export the skipPage method')
  t.notEqual(setComposite, undefined, 'it should export the setComposite method')
  t.notEqual(setControlNames, undefined, 'it should export the setControlNames method')
  t.notEqual(setRepeatable, undefined, 'it should export the setRepeatable method')
  t.notEqual(setMultipartForm, undefined, 'it should export the setMultipartForm method')
  t.notEqual(processUploads, undefined, 'it should export the processUploads method')
  t.notEqual(setUploads, undefined, 'it should export the setUploads method')
  t.notEqual(processInput, undefined, 'it should export the processInput method')
  t.notEqual(validateInput, undefined, 'it should export the validateInput method')
  t.notEqual(formatProperties, undefined, 'it should export the formatProperties method')
  t.notEqual(updateControlNames, undefined, 'it should export the updateControlNames method')
  t.notEqual(setService, undefined, 'it should export the setService method')
  t.notEqual(skipComponents, undefined, 'it should export the skipComponents method')
  t.notEqual(kludgeUpdates, undefined, 'it should export the kludgeUpdates method')
  t.notEqual(components, undefined, 'it should export the component controllers')

  t.equal(Object.keys(pageMethods).length, 15, 'it should export no unexpected methods')

  t.end()
})
