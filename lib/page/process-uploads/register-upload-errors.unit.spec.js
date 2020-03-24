require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const { stub } = require('sinon')
const proxyquire = require('proxyquire')

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getStringStub = stub(serviceData, 'getString')
getStringStub.callsFake(lookup => {
  if (lookup === 'error.upload.unknown') {
    return
  }
  return 'string value'
})

const setErrors = require('~/fb-runner-node/page/set-errors/set-errors')

const setErrorsStub = stub(setErrors, 'setErrors')

const registerUploadErrors = proxyquire('./register-upload-errors', {
  '~/fb-runner-node/page/set-errors/set-errors': setErrors
})

const userData = {
  getBodyInput: () => ({})
}

test('When registering upload errors with an error message', t => {
  const pageInstance = {
    components: [{
      name: 'test',
      validation: {
        maxSize: 10000
      }
    }]
  }

  const fileErrors = {
    BOOM: [{
      fieldname: 'test[1]',
      originalname: 'originalname.txt',
      errorMessage: 'This error has an error message'
    }]
  }

  registerUploadErrors(pageInstance, userData, fileErrors)

  const [
    firstArg,
    [
      error
    ]
  ] = setErrorsStub.getCall(0).args

  t.equal(firstArg, pageInstance, 'invokes `setErrors` with `pageInstance` as the first argument')

  t.deepEqual(Object.keys(error), ['instance', 'errorType', 'error'], 'the error object has the expected properties')

  t.equal(error.instance, 'test', 'normalises the upload control name')
  t.equal(error.errorType, 'This error has an error message', 'uses the error message as the error type')
  t.deepEqual(error.error, {
    values: {
      filename: 'originalname.txt',
      maxFiles: 1,
      minFiles: 1,
      maxSize: 10000,
      accept: undefined
    },
    target: 'test[1]'
  }, 'adds the original filename to the error object')

  setErrorsStub.resetHistory()

  t.end()
})

test('When registering upload errors without an error message', t => {
  const pageInstance = {}
  const fileErrors = {
    BOOM: [{
      fieldname: 'test[1]',
      originalname: 'originalname.txt',
      maxSize: 10000
    }]
  }

  setErrorsStub.resetHistory()

  registerUploadErrors(pageInstance, userData, fileErrors)

  const [
    firstArg,
    [{
      errorType
    }]
  ] = setErrorsStub.getCall(0).args

  t.equal(firstArg, pageInstance, 'invokes `setErrors` with `pageInstance` as the first argument')

  t.equal(errorType, 'BOOM', 'uses the `fileErrors` field name as the error type')

  t.end()
})
