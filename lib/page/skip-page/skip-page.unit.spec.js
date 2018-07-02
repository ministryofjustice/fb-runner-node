const test = require('tape')

// const {deepClone} = require('@ministryofjustice/fb-utils-node')

const skipPage = require('./skip-page')

// const skipPageClone = (instance, input) => skipPage(deepClone(instance), input)

test('When skipPage is required ', t => {
  t.equal(typeof skipPage, 'function', 'it should export a function')
  t.end()
})
