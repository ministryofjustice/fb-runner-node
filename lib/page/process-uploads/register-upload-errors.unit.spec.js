const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const serviceData = require('../../service-data/service-data')
const getStringStub = stub(serviceData, 'getString')
getStringStub.callsFake(lookup => {
  if (lookup === 'error.fileupload.unknown') {
    return
  }
  return 'string value'
})

const setErrors = require('../set-errors/set-errors')

const setErrorsStub = stub(setErrors, 'setErrors')

const registerUploadErrors = proxyquire('./register-upload-errors', {
  '../set-errors/set-errors': setErrors
})

const userData = {
  getBodyInput: () => ({})
}

test('When registering upload errors', t => {
  const pageInstance = {
    components: [{
      name: 'test',
      maxSize: 10000
    }]
  }
  const fileErrors = {
    BOOM: [{
      fieldname: 'test[1]',
      originalname: 'originalname.txt',
      errorMessage: 'invalid.boom'
    }]
  }

  registerUploadErrors(pageInstance, userData, fileErrors)
  // not interested in the updated pageInstance

  const setErrorsArgs = setErrorsStub.getCall(0).args
  t.equal(setErrorsArgs[0], pageInstance, 'it should call setErrors passing the pageInstance as the instance to have errors added to')

  t.equal(setErrorsArgs[1].length, 1, 'it should call setErrors passing the correct number of error objects')
  t.deepEqual(Object.keys(setErrorsArgs[1][0]), ['instance', 'errorType', 'error'], 'it should call setErrors passing error objects with the expected properties')
  const errorObject = setErrorsArgs[1][0]
  t.equal(errorObject.instance, 'test', 'it should normalise upload control names in error objects passed to setErrors')
  t.equal(errorObject.errorType, 'fileupload.invalid.boom', 'it should prefix the error message with fileupload in error objects passed to setErrors')
  t.deepEqual(errorObject.error, {
    values: {
      filename: 'originalname.txt',
      maxSize: 10000
    },
    target: 'test[1]'
  }, 'it should add the original filename to the error bundle in error objects passed to setErrors')

  setErrorsStub.resetHistory()
  t.end()
})

test('When registering upload errors which are missing an error message', t => {
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
  // not interested in the updated pageInstance

  const setErrorsArgs = setErrorsStub.getCall(0).args
  const errorObject = setErrorsArgs[1][0]
  t.equal(errorObject.errorType, 'fileupload.BOOM', 'it should prefix the error message with error type in error objects passed to setErrors')

  t.end()
})

test('When registering upload errors which are unknown', t => {
  const pageInstance = {}
  const fileErrors = {
    unknown: [{
      fieldname: 'test[1]',
      originalname: 'originalname.txt',
      maxSize: 10000
    }]
  }

  setErrorsStub.resetHistory()
  registerUploadErrors(pageInstance, userData, fileErrors)
  // not interested in the updated pageInstance

  const setErrorsArgs = setErrorsStub.getCall(0).args
  const errorObject = setErrorsArgs[1][0]
  t.equal(errorObject.errorType, 'fileupload', 'it should use the generic fileupload error if no string exists for error type')

  t.end()
})
