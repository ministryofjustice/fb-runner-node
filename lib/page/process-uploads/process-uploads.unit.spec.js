const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const {FBTest} = require('@ministryofjustice/fb-utils-node')
const {stubModule, resetStubsHistory} = FBTest()

const utils = {
  getUploadControls: () => {}
}
const getUploadControlStub = stub(utils, 'getUploadControls')

const getAllowedUploadControlsStub = stubModule('getAllowedUploadControls')
const processUploadControlsStub = stubModule('processUploadControls', async () => {})
const processUploadedFilesStub = stubModule('processUploadedFiles', true)
const registerUploadErrorsStub = stubModule('registerUploadErrors', true)
const storeUploadedFilesStub = stubModule('storeUploadedFiles', true)

const processUploads = proxyquire('./process-uploads', {
  '../utils/utils-uploads': utils,
  './get-allowed-upload-controls': getAllowedUploadControlsStub,
  './process-upload-controls': processUploadControlsStub,
  './process-uploaded-files': processUploadedFilesStub,
  './register-upload-errors': registerUploadErrorsStub,
  './store-uploaded-files': storeUploadedFilesStub
})

test('When processUploads is called when method is not POST', async t => {
  const pageInstance = {
    encType: true
  }
  const userData = {
    req: {}
  }
  await processUploads(pageInstance, userData)

  t.equal(getUploadControlStub.notCalled, true, 'it should not call getUploadControls')
  t.equal(getAllowedUploadControlsStub.notCalled, true, 'it should not call getAllowedUploadControls')
  t.equal(processUploadControlsStub.notCalled, true, 'it should not call processUploadControls')
  t.equal(processUploadedFilesStub.notCalled, true, 'it should not call processUploadedFiles')
  t.equal(registerUploadErrorsStub.notCalled, true, 'it should not call registerUploadErrors')
  t.equal(storeUploadedFilesStub.notCalled, true, 'it should not call storeUploadedFiles')

  t.end()
  resetStubsHistory()
})

test('When processUploads is called when encType is not true', async t => {
  const pageInstance = {}
  const userData = {
    req: {
      method: 'POST'
    }
  }
  await processUploads(pageInstance, userData)

  t.equal(getUploadControlStub.notCalled, true, 'it should not call getUploadControls')
  t.equal(getAllowedUploadControlsStub.notCalled, true, 'it should not call getAllowedUploadControls')
  t.equal(processUploadControlsStub.notCalled, true, 'it should not call processUploadControls')
  t.equal(processUploadedFilesStub.notCalled, true, 'it should not call processUploadedFiles')
  t.equal(registerUploadErrorsStub.notCalled, true, 'it should not call registerUploadErrors')
  t.equal(storeUploadedFilesStub.notCalled, true, 'it should not call storeUploadedFiles')

  t.end()
  resetStubsHistory()
})

test('When processUploads is called when encType is true and method is POST', async t => {
  const pageInstance = {
    encType: true
  }
  const userData = {
    req: {
      method: 'POST'
    }
  }
  await processUploads(pageInstance, userData)

  t.plan(6)

  t.equal(getUploadControlStub.called, true, 'it should call getUploadControls')
  t.equal(getAllowedUploadControlsStub.called, true, 'it should call getAllowedUploadControls')
  t.equal(processUploadControlsStub.called, true, 'it should call processUploadControls')
  t.equal(processUploadedFilesStub.called, true, 'it should call processUploadedFiles')
  t.equal(registerUploadErrorsStub.called, true, 'it should call registerUploadErrors')
  t.equal(storeUploadedFilesStub.called, true, 'it should call storeUploadedFiles')

  t.end()
  resetStubsHistory()
})
