require('@ministryofjustice/module-alias/register-module')(module)

const {
  test
} = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const validateCsrfStub = sinon.stub().callsFake(token => {
  if (token === 'valid') {
    return
  }
  throw new Error('CSRF')
})

const utils = {
  getComponents () {}
}

const saveDataStub = sinon.stub()
const getComponentsStub = sinon.stub(utils, 'getComponents')

const getAllowedComponentsStub = sinon.stub()
const processComponentsStub = sinon.stub()
const processUploadedFilesStub = sinon.stub()
const registerUploadErrorsStub = sinon.stub()
const storeUploadedFilesStub = sinon.stub()

const processUploads = proxyquire('./process-uploads', {
  '~/fb-runner-node/page/utils/utils-uploads': utils,
  './get-allowed-upload-controls': getAllowedComponentsStub,
  './process-upload-controls': processComponentsStub,
  './process-uploaded-files': processUploadedFilesStub,
  './register-upload-errors': registerUploadErrorsStub,
  './store-uploaded-files': storeUploadedFilesStub,
  '~/fb-runner-node/middleware/csrf/csrf': { validateCsrf: validateCsrfStub }
})

test('When processUploads is called when method is not POST', async t => {
  const pageInstance = {
    encType: true
  }
  const userData = {
    req: {},
    saveData: saveDataStub
  }
  await processUploads(pageInstance, userData)

  t.equal(getComponentsStub.notCalled, true, 'it should not call getComponents')
  t.equal(getAllowedComponentsStub.notCalled, true, 'it should not call getAllowedComponents')
  t.equal(processComponentsStub.notCalled, true, 'it should not call processComponents')
  t.equal(processUploadedFilesStub.notCalled, true, 'it should not call processUploadedFiles')
  t.equal(registerUploadErrorsStub.notCalled, true, 'it should not call registerUploadErrors')
  t.equal(storeUploadedFilesStub.notCalled, true, 'it should not call storeUploadedFiles')

  t.end()
})

test('When processUploads is called when encType is not true', async t => {
  const pageInstance = {}
  const userData = {
    req: {
      method: 'POST'
    },
    saveData: saveDataStub
  }
  await processUploads(pageInstance, userData)

  t.equal(getComponentsStub.notCalled, true, 'it should not call getComponents')
  t.equal(getAllowedComponentsStub.notCalled, true, 'it should not call getAllowedComponents')
  t.equal(processComponentsStub.notCalled, true, 'it should not call processComponents')
  t.equal(processUploadedFilesStub.notCalled, true, 'it should not call processUploadedFiles')
  t.equal(registerUploadErrorsStub.notCalled, true, 'it should not call registerUploadErrors')
  t.equal(storeUploadedFilesStub.notCalled, true, 'it should not call storeUploadedFiles')

  t.end()
})

test('When processUploads is called when encType is true and method is POST', async t => {
  const pageInstance = {
    encType: true
  }
  const userData = {
    getUserId: sinon.stub().returns('userId'),
    getBodyInput: sinon.stub().returns({ _csrf: 'valid' }),
    req: {
      method: 'POST'
    },
    saveData: saveDataStub
  }
  await processUploads(pageInstance, userData)

  t.equal(getComponentsStub.called, true, 'it should call getComponents')
  t.equal(getAllowedComponentsStub.called, true, 'it should call getAllowedComponents')
  t.equal(processComponentsStub.called, true, 'it should call processComponents')
  t.equal(processUploadedFilesStub.called, true, 'it should call processUploadedFiles')
  t.equal(registerUploadErrorsStub.called, true, 'it should call registerUploadErrors')
  t.equal(storeUploadedFilesStub.called, true, 'it should call storeUploadedFiles')

  t.end()
})

test('When processUploads is called but csrf verification fails', async t => {
  const pageInstance = {
    encType: true
  }
  const userData = {
    getUserId: sinon.stub().returns('userId'),
    getBodyInput: sinon.stub().returns({}),
    req: {
      method: 'POST'
    },
    saveData: saveDataStub
  }

  try {
    t.throws(await processUploads(pageInstance, userData))
  } catch (e) {
    t.equal(e.message, 'CSRF')
  }

  t.end()
})
