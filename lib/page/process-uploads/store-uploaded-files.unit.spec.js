const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const fs = require('fs')
let fsUnlinkStub = stub(fs, 'unlink') // eslint-disable-line no-unused-vars

const FBUserFileStoreClient = require('../../client/user-filestore/user-filestore')
let FBUserFileStoreClientStub = stub(FBUserFileStoreClient, 'store') // eslint-disable-line no-unused-vars
FBUserFileStoreClientStub.callsFake(async (file) => {
  return {
    file,
    value: {
      timestamp: 1551372750086
    }
  }
})
const userData = {
  getUserDataProperty: () => {},
  setUserDataProperty: () => {},
  setFlashMessage: () => {},
  setSuccessfulUpload: () => {}
}
const setUserDataPropertyStub = stub(userData, 'setUserDataProperty')
const setFlashMessageStub = stub(userData, 'setFlashMessage')
const setSuccessfulUploadStub = stub(userData, 'setSuccessfulUpload')
const uuid = require('uuid')
const uuidStub = stub(uuid, 'v4')
uuidStub.callsFake(() => 'uuid')

const storeUploadedFiles = proxyquire('./store-uploaded-files', {
  fs: fs,
  '../../client/user-filestore/user-filestore': FBUserFileStoreClient
})

test('When storeUploadedFiles is passed a list of uploaded files to store', async t => {
  const uploadedResults = {
    files: {
      'test[1]': [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024,
          path: '/tmp/uploadedfilehash',
          uuid: 'uuid'
        }
      ]
    }
  }

  const fileErrors = await storeUploadedFiles(userData, uploadedResults)

  t.equal(fileErrors, undefined, 'it should not set any errors')

  t.deepEqual(FBUserFileStoreClientStub.getCall(0).args[0], {
    fieldname: 'test[1]',
    originalname: 'originalname',
    size: 10485760,
    path: '/tmp/uploadedfilehash',
    uuid: 'uuid'
  }, 'it should call the filestore client with the correct arguments')

  const setUserDataPropertyStubArgs = setUserDataPropertyStub.getCall(0).args
  t.deepEqual(setUserDataPropertyStubArgs[0], 'test', 'it should update the correct user data property')
  t.deepEqual(setUserDataPropertyStubArgs[1], [{
    fieldname: 'test[1]',
    originalname: 'originalname',
    size: 10485760,
    path: '/tmp/uploadedfilehash',
    uuid: 'uuid',
    timestamp: 1551372750086
  }], 'it should update the user data property with the correct file details')

  const setFlashMessageStubArgs = setFlashMessageStub.getCall(0).args
  t.deepEqual(setFlashMessageStubArgs[0], {
    type: 'upload',
    message: 'Dun an upload for test'
  }, 'it should set a flash message for the upload')

  const setSuccessfulUploadStubArgs = setSuccessfulUploadStub.getCall(0).args
  t.deepEqual(setSuccessfulUploadStubArgs[0], 'test', 'it should increment the field’s successful file upload count')

  t.deepEqual(fsUnlinkStub.getCall(0).args[0], '/tmp/uploadedfilehash', 'it should delete the file after it has been uploaded')

  t.end()
  setUserDataPropertyStub.resetHistory()
  fsUnlinkStub.resetHistory()
})

test('When storeUploadedFiles encounters an error uploading a file', async t => {
  const uploadedResults = {
    files: {
      'test[1]': [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024,
          path: '/tmp/uploadedfilehash'
        }
      ]
    }
  }

  FBUserFileStoreClientStub.restore()
  FBUserFileStoreClientStub = stub(FBUserFileStoreClient, 'store')
  FBUserFileStoreClientStub.callsFake(async (file) => {
    return {
      file,
      error: {
        code: 500,
        message: 'AWS Bill not paid'
      }
    }
  })

  const fileErrors = await storeUploadedFiles(userData, uploadedResults)

  t.deepEqual(fileErrors, {
    UPLOAD_FAILED: [{
      fieldname: 'test[1]',
      originalname: 'originalname',
      errorMessage: 'AWS Bill not paid',
      errorCode: 500,
      errorType: 'Object'
    }]
  }, 'it should set an error noting that the attempt to file store failed')

  t.deepEqual(FBUserFileStoreClientStub.getCall(0).args[0], {
    fieldname: 'test[1]',
    originalname: 'originalname',
    size: 10485760,
    path: '/tmp/uploadedfilehash'
  }, 'it should call the filestore client with the correct arguments')

  t.deepEqual(setUserDataPropertyStub.notCalled, true, 'it should not update the user data property')

  t.deepEqual(fsUnlinkStub.getCall(0).args[0], '/tmp/uploadedfilehash', 'it should delete the file even though it has not been uploaded')

  t.end()
  setUserDataPropertyStub.resetHistory()
})
