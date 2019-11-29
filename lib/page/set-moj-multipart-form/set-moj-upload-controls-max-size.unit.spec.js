require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')
const serviceData = require('~/fb-runner-node/service-data/service-data')
const getMaxSizeStub = stub(serviceData, 'getInstanceProperty')
getMaxSizeStub.callsFake(() => '5Mb')

const defaultMaxSize = 5 * 1024 * 1024
const defaultMaxSizeHuman = '5MB'

const setMOJUploadControlsMaxSize = proxyquire('./set-moj-upload-controls-max-size', {
  '~/fb-runner-node/service-data/service-data': serviceData
})

test('When setMOJUploadControlsMaxSize is called it should add its default maxsize as a property of itself', t => {
  const uploadControls = [{
    _type: 'mojFileupload',
    name: 'upload'
  }]
  setMOJUploadControlsMaxSize(uploadControls)
  t.equal(setMOJUploadControlsMaxSize.defaultMaxSize, defaultMaxSize, 'it should set setMOJUploadControlsMaxSize.defaultMaxSize to the default maxSize')
  t.end()
})

test('When setMOJUploadControlsMaxSize is called on upload controls with no maxSize set', t => {
  const uploadControls = [{
    _type: 'mojFileupload',
    name: 'upload'
  }]
  setMOJUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.validation.maxSize, defaultMaxSize, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.validation.maxSizeHuman, defaultMaxSizeHuman, 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})

test('When setMOJUploadControlsMaxSize is called on upload controls with an invalid maxSize set', t => {
  const uploadControls = [{
    _type: 'mojFileupload',
    name: 'upload',
    validation: {
      maxSize: 's'
    }
  }]
  setMOJUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.validation.maxSize, defaultMaxSize, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.validation.maxSizeHuman, defaultMaxSizeHuman, 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})

test('When setMOJUploadControlsMaxSize is called on upload controls with a maxSize set', t => {
  const uploadControls = [{
    _type: 'mojFileupload',
    name: 'upload',
    validation: {
      maxSize: '24MB'
    }
  }]
  setMOJUploadControlsMaxSize(uploadControls)
  const uploadControl = uploadControls[0]
  t.equal(uploadControl.validation.maxSize, 24 * 1024 * 1024, 'it should set maxSize to the default maxSize')
  t.equal(uploadControl.validation.maxSizeHuman, '24MB', 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})
