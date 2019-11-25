require('@ministryofjustice/module-alias/register')

const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')
const serviceData = require('~/fb-runner-node/service-data/service-data')
const getMaxSizeStub = stub(serviceData, 'getInstanceProperty')
getMaxSizeStub.callsFake(() => '5Mb')

const defaultMaxSize = 5 * 1024 * 1024
const defaultMaxSizeHuman = '5MB'

const setUploadControlsMaxSize = proxyquire('./set-upload-controls-max-size', {
  '~/fb-runner-node/service-data/service-data': serviceData
})

test('When setUploadControlsMaxSize is called it should add its default maxsize as a property of itself', t => {
  const uploadControls = [{
    _type: 'fileupload',
    name: 'upload'
  }]
  setUploadControlsMaxSize(uploadControls)
  t.equal(setUploadControlsMaxSize.defaultMaxSize, defaultMaxSize, 'it should set setUploadControlsMaxSize.defaultMaxSize to the default maxSize')
  t.end()
})

test('When setUploadControlsMaxSize is called on upload controls with no maxSize set', t => {
  const uploadControls = [{
    _type: 'fileupload',
    name: 'upload'
  }]
  setUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.validation.maxSize, defaultMaxSize, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.validation.maxSizeHuman, defaultMaxSizeHuman, 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})

test('When setUploadControlsMaxSize is called on upload controls with an invalid maxSize set', t => {
  const uploadControls = [{
    _type: 'fileupload',
    name: 'upload',
    validation: {
      maxSize: 's'
    }
  }]
  setUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.validation.maxSize, defaultMaxSize, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.validation.maxSizeHuman, defaultMaxSizeHuman, 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})

test('When setUploadControlsMaxSize is called on upload controls with a maxSize set', t => {
  const uploadControls = [{
    _type: 'fileupload',
    name: 'upload',
    validation: {
      maxSize: '24MB'
    }
  }]
  setUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.validation.maxSize, 24 * 1024 * 1024, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.validation.maxSizeHuman, '24MB', 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})
