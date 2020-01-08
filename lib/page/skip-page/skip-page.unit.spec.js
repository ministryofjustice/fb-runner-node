const test = require('tape')

const skipPage = require('./skip-page')

// const skipPageClone = (instance, input) => skipPage(cloneDeep(instance), input)

test('When skipPage is required ', t => {
  t.equal(typeof skipPage, 'function', 'it should export a function')
  t.end()
})
