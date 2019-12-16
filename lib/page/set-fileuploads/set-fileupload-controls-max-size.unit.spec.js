require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const serviceData = require('~/fb-runner-node/service-data/service-data')

sinon.stub(serviceData, 'getInstanceProperty').returns('5Mb')

const defaultMaxSize = 5 * 1024 * 1024
const defaultMaxSizeHuman = '5MB'

const setFileUploadControlsMaxSize = proxyquire('./set-fileupload-controls-max-size', {
  '~/fb-runner-node/service-data/service-data': serviceData
})

test('When setFileUploadControlsMaxSize is called it should add its default maxsize as a property of itself', t => {
  const fileUploadControls = [{
    _type: 'fileupload',
    name: 'upload'
  }]
  setFileUploadControlsMaxSize(fileUploadControls)
  t.equal(setFileUploadControlsMaxSize.defaultMaxSize, defaultMaxSize, 'it should set setFileUploadControlsMaxSize.defaultMaxSize to the default maxSize')
  t.end()
})

test('When setFileUploadControlsMaxSize is called on upload controls with no maxSize set', t => {
  const fileUploadControls = [{
    _type: 'fileupload',
    name: 'upload'
  }]
  setFileUploadControlsMaxSize(fileUploadControls)
  const fileUploadControl = fileUploadControls[0]
  t.equal(fileUploadControl.validation.maxSize, defaultMaxSize, 'it should set maxSize to the default maxSize')
  t.equal(fileUploadControl.validation.maxSizeHuman, defaultMaxSizeHuman, 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})

test('When setFileUploadControlsMaxSize is called on upload controls with an invalid maxSize set', t => {
  const fileUploadControls = [{
    _type: 'fileupload',
    name: 'upload',
    validation: {
      maxSize: 's'
    }
  }]
  setFileUploadControlsMaxSize(fileUploadControls)
  const fileUploadControl = fileUploadControls[0]
  t.equal(fileUploadControl.validation.maxSize, defaultMaxSize, 'it should set maxSize to the default maxSize')
  t.equal(fileUploadControl.validation.maxSizeHuman, defaultMaxSizeHuman, 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})

test('When setFileUploadControlsMaxSize is called on upload controls with a maxSize set', t => {
  const fileUploadControls = [{
    _type: 'fileupload',
    name: 'upload',
    validation: {
      maxSize: '24MB'
    }
  }]
  setFileUploadControlsMaxSize(fileUploadControls)
  const fileUploadControl = fileUploadControls[0]
  t.equal(fileUploadControl.validation.maxSize, 24 * 1024 * 1024, 'it should set maxSize to the default maxSize')
  t.equal(fileUploadControl.validation.maxSizeHuman, '24MB', 'it should set maxSizeHuman to the human readable equivalent')
  t.end()
})
