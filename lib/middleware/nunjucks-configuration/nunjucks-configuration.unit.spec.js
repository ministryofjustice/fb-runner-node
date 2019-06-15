const test = require('tape')

const nunjucksConfiguration = require('./nunjucks-configuration')

test('When nunjucks configuration is required ', t => {
  t.equal(typeof nunjucksConfiguration.init, 'function', 'it should export the init method')

  t.end()
})
