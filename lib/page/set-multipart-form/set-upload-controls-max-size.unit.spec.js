const test = require('tape')

const setUploadControlsMaxSize = require('./set-upload-controls-max-size')

test('When setUploadControlsMaxSize is called on upload controls with no maxSize set', t => {
  let uploadControls = [{
    _type: 'fileupload',
    name: 'upload'
  }]
  setUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.maxSize, 10 * 1024 * 1024, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.maxSizeHuman, '10MB', 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})

test('When setUploadControlsMaxSize is called on upload controls with an invalid maxSize set', t => {
  let uploadControls = [{
    _type: 'fileupload',
    name: 'upload',
    maxSize: 's'
  }]
  setUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.maxSize, 10 * 1024 * 1024, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.maxSizeHuman, '10MB', 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})

test('When setUploadControlsMaxSize is called on upload controls with a maxSize set', t => {
  let uploadControls = [{
    _type: 'fileupload',
    name: 'upload',
    maxSize: '24Mb'
  }]
  setUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.maxSize, 24 * 1024 * 1024, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.maxSizeHuman, '24MB', 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})
