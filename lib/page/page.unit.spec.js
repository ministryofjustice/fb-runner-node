const test = require('tape')

const pageMethods = require('./page')

const expectedMethods = [
  'skipPage',
  'setComposite',
  'setControlNames',
  'setRepeatable',
  'setMultipartForm',
  'processUploads',
  'setUploads',
  'removeItem',
  'addItem',
  'processInput',
  'validateInput',
  'redirectNextPage',
  'setFormContent',
  'setDefaultValues',
  'formatProperties',
  'getDisplayValue',
  'updateControlNames',
  'setService',
  'skipComponents',
  'kludgeUpdates'
]

const expectedObjects = []

test('When the pages module is loaded', function (t) {
  t.equal(Object.keys(pageMethods).length, expectedMethods.length + expectedObjects.length, 'it should export no unexpected methods or objects')
  t.end()
})

expectedMethods.forEach(method => {
  test('When the pages module is loaded', function (t) {
    t.equal(typeof pageMethods[method], 'function', `it should export the ${method} method`)
    t.end()
  })
})

expectedObjects.forEach(obj => {
  test('When the pages module is loaded', function (t) {
    t.equal(typeof pageMethods[obj], 'object', `it should export the ${obj} object`)
    t.end()
  })
})
