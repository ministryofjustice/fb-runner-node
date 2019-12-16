const test = require('tape')

const getAllowedUploadControls = require('./get-allowed-upload-controls')

const uploadControlsMaxFiles = [{
  name: 'test',
  maxFiles: 2
}]

const uploadControlsNoMaxFiles = [{
  name: 'test'
}]

const uploadControlsMultiple = [{
  name: 'test',
  maxFiles: 2
}, {
  name: 'anothertest'
}]

test('Without `maxFiles`', t => {
  const allowedUploadControls = getAllowedUploadControls(uploadControlsNoMaxFiles)

  t.deepEqual(allowedUploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }], 'returns one of one')

  t.end()
})

test('With `maxFiles`', t => {
  const allowedUploadControls = getAllowedUploadControls(uploadControlsMaxFiles)

  t.deepEqual(allowedUploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }, {
    name: 'test[2]',
    maxCount: 1
  }], 'returns two of two')

  t.end()
})

test('With and without `maxFiles` for multiple controls', t => {
  const allowedUploadControls = getAllowedUploadControls(uploadControlsMultiple)

  t.deepEqual(allowedUploadControls, [{
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
