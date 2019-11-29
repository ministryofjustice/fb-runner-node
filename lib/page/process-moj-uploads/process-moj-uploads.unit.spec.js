require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const {FBTest} = require('@ministryofjustice/fb-utils-node')
const {stubModule, resetStubsHistory} = FBTest()

const csrf = {}
const validateCsrfStub = stub()
validateCsrfStub.callsFake(token => {
  if (token === 'valid') {
    return
  }
  throw new Error('CSRF')
})
csrf.validateCsrf = validateCsrfStub

const utils = {
  getUploadControls: () => {}
}
const getUploadControlStub = stub(utils, 'getUploadControls')

const getAllowedMOJUploadControlsStub = stubModule('getAllowedMOJUploadControls')
const processMOJUploadControlsStub = stubModule('processMOJUploadControls', async () => {})
const processMOJUploadedFilesStub = stubModule('processMOJUploadedFiles', true)
const registerMOJUploadErrorsStub = stubModule('registerMOJUploadErrors', true)
const storeMOJUploadedFilesStub = stubModule('storeMOJUploadedFiles', true)

const processMOJUploads = proxyquire('./process-moj-uploads', {
  '~/fb-runner-node/page/utils/utils-uploads': utils,
  './get-allowed-moj-upload-controls': getAllowedMOJUploadControlsStub,
  './process-moj-upload-controls': processMOJUploadControlsStub,
  './process-moj-uploaded-files': processMOJUploadedFilesStub,
  './register-moj-upload-errors': registerMOJUploadErrorsStub,
  './store-moj-uploaded-files': storeMOJUploadedFilesStub,
  '~/fb-runner-node/middleware/csrf/csrf': csrf
})

test('When processMOJUploads is called when method is not POST', async t => {
  const pageInstance = {
    encType: true
  }
  const userData = {
    req: {}
  }
  await processMOJUploads(pageInstance, userData)

  t.equal(getUploadControlStub.notCalled, true, 'it should not call getUploadControls')
  t.equal(getAllowedMOJUploadControlsStub.notCalled, true, 'it should not call getAllowedMOJUploadControls')
  t.equal(processMOJUploadControlsStub.notCalled, true, 'it should not call processMOJUploadControls')
  t.equal(processMOJUploadedFilesStub.notCalled, true, 'it should not call processMOJUploadedFiles')
  t.equal(registerMOJUploadErrorsStub.notCalled, true, 'it should not call registerMOJUploadErrors')
  t.equal(storeMOJUploadedFilesStub.notCalled, true, 'it should not call storeMOJUploadedFiles')

  t.end()
  resetStubsHistory()
})

test('When processMOJUploads is called when encType is not true', async t => {
  const pageInstance = {}
  const userData = {
    req: {
      method: 'POST'
    }
  }
  await processMOJUploads(pageInstance, userData)

  t.equal(getUploadControlStub.notCalled, true, 'it should not call getUploadControls')
  t.equal(getAllowedMOJUploadControlsStub.notCalled, true, 'it should not call getAllowedMOJUploadControls')
  t.equal(processMOJUploadControlsStub.notCalled, true, 'it should not call processMOJUploadControls')
  t.equal(processMOJUploadedFilesStub.notCalled, true, 'it should not call processMOJUploadedFiles')
  t.equal(registerMOJUploadErrorsStub.notCalled, true, 'it should not call registerMOJUploadErrors')
  t.equal(storeMOJUploadedFilesStub.notCalled, true, 'it should not call storeMOJUploadedFiles')

  t.end()
  resetStubsHistory()
})

test('When processMOJUploads is called when encType is true and method is POST', async t => {
  const pageInstance = {
    encType: true
  }
  const userData = {
    getUserId: () => 'userId',
    getBodyInput: () => ({_csrf: 'valid'}),
    req: {
      method: 'POST'
    }
  }
  await processMOJUploads(pageInstance, userData)

  t.equal(getUploadControlStub.called, true, 'it should call getUploadControls')
  t.equal(getAllowedMOJUploadControlsStub.called, true, 'it should call getAllowedMOJUploadControls')
  t.equal(processMOJUploadControlsStub.called, true, 'it should call processMOJUploadControls')
  t.equal(processMOJUploadedFilesStub.called, true, 'it should call processMOJUploadedFiles')
  t.equal(registerMOJUploadErrorsStub.called, true, 'it should call registerMOJUploadErrors')
  t.equal(storeMOJUploadedFilesStub.called, true, 'it should call storeMOJUploadedFiles')

  t.end()
  resetStubsHistory()
})

test('When processMOJUploads is called but csrf verification fails', async t => {
  const pageInstance = {
    encType: true
  }
  const userData = {
    getUserId: () => 'userId',
    getBodyInput: () => ({}),
    req: {
      method: 'POST'
    }
  }

  try {
    t.throws(await processMOJUploads(pageInstance, userData))
  } catch (e) {
    t.equal(e.message, 'CSRF')
  }

  t.end()
  resetStubsHistory()
})
