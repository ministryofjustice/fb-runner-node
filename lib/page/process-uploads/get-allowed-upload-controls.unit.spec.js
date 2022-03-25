const test = require('tape')

const getAllowedComponents = require('./get-allowed-upload-controls')

const componentsMaxFiles = [{
  name: 'test',
  maxFiles: 2
}]

const componentsNoMaxFiles = [{
  name: 'test'
}]

const componentsMultiple = [{
  name: 'test',
  maxFiles: 2
}, {
  name: 'anothertest'
}]

test('Without `maxFiles`', t => {
  const allowedComponents = getAllowedComponents(componentsNoMaxFiles)

  t.same(allowedComponents, [{
    name: 'test[1]',
    maxCount: 1
  }], 'returns one of one')

  t.end()
})

test('With `maxFiles`', t => {
  const allowedComponents = getAllowedComponents(componentsMaxFiles)

  t.same(allowedComponents, [{
    name: 'test[1]',
    maxCount: 1
  }, {
    name: 'test[2]',
    maxCount: 1
  }], 'returns two of two')

  t.end()
})

test('With and without `maxFiles` for multiple controls', t => {
  const allowedComponents = getAllowedComponents(componentsMultiple)

  t.same(allowedComponents, [{
    name: 'test[1]',
    maxCount: 1
  }, {
    name: 'test[2]',
    maxCount: 1
  }, {
    name: 'anothertest[1]',
    maxCount: 1
  }], 'returns three of three')

  t.end()
})
