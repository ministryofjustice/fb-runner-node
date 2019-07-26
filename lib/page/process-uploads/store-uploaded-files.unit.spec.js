const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const fs = require('fs')
const fsUnlinkStub = stub(fs, 'unlink')

const serviceData = require('../../service-data/service-data')
const getStringStub = stub(serviceData, 'getString')
getStringStub.callsFake(() => 'Successfully uploaded {filename}')

const userFileStoreClient = require('../../client/user-filestore/user-filestore')
let FBUserFileStoreClientStub = stub(userFileStoreClient, 'storeFromPath')
FBUserFileStoreClientStub.callsFake(async (userId, userToken, file) => {
  return {
    fingerprint: 'fingerprint',
    timestamp: 1551372750086
  }
})
const logger = stub()
const userData = {
  getUserId: () => 'userid',
  getUserToken: () => 'usertoken',
  getBodyInput: () => ({}),
  getUserDataProperty: () => {},
  setUserDataProperty: () => {},
  setFlashMessage: () => {},
  setSuccessfulUpload: () => {},
  logger
}
const setUserDataPropertyStub = stub(userData, 'setUserDataProperty')
const setFlashMessageStub = stub(userData, 'setFlashMessage')
const setSuccessfulUploadStub = stub(userData, 'setSuccessfulUpload')
const uuid = require('uuid')
const uuidStub = stub(uuid, 'v4')
uuidStub.callsFake(() => 'uuid')

const storeUploadedFiles = proxyquire('./store-uploaded-files', {
  fs: fs,
  '../../client/user-filestore/user-filestore': userFileStoreClient,
  '../../service-data/service-data': serviceData
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

  const FBUserFileStoreClientStubArgs = FBUserFileStoreClientStub.getCall(0).args
  t.equal(FBUserFileStoreClientStubArgs[0], '/tmp/uploadedfilehash', 'it should call the storeFromPath method with the correct filepath')
  t.deepEqual(FBUserFileStoreClientStubArgs[1], {
    userId: 'userid',
    userToken: 'usertoken',
    policy: {}
  }, 'it should call the storeFromPath method with the correct user details')
  t.equal(FBUserFileStoreClientStubArgs[2], logger, 'it should call the storeFromPath method with any logger instance attached to the userData object')

  const setUserDataPropertyStubArgs = setUserDataPropertyStub.getCall(0).args
  t.deepEqual(setUserDataPropertyStubArgs[0], 'test', 'it should update the correct user data property')
  t.deepEqual(setUserDataPropertyStubArgs[1], [{
    fieldname: 'test[1]',
    originalname: 'originalname',
    size: 10485760,
    path: '/tmp/uploadedfilehash',
    uuid: 'uuid',
    timestamp: 1551372750086,
    fingerprint: 'fingerprint',
    url: 'SUBMITTER_URL/service/SERVICE_SLUG/user/userid/fingerprint'
  }], 'it should update the user data property with the correct file details')

  const setFlashMessageStubArgs = setFlashMessageStub.getCall(0).args
  t.deepEqual(setFlashMessageStubArgs[0], {
    type: 'file.uploaded',
    html: 'Successfully uploaded originalname'
  }, 'it should set a flash message for the upload')

  const setSuccessfulUploadStubArgs = setSuccessfulUploadStub.getCall(0).args
  t.deepEqual(setSuccessfulUploadStubArgs[0], 'test', 'it should increment the field’s successful file upload count')

  t.deepEqual(fsUnlinkStub.getCall(0).args[0], '/tmp/uploadedfilehash', 'it should delete the file after it has been uploaded')

  t.end()
  setUserDataPropertyStub.resetHistory()
  fsUnlinkStub.resetHistory()
  FBUserFileStoreClientStub.resetHistory()
})

test('When storeUploadedFiles is passed a files with policy properties', async t => {
  const uploadedResults = {
    files: {
      'test[1]': [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 10 * 1024 * 1024,
          path: '/tmp/uploadedfilehash',
          uuid: 'uuid',
          maxSize: 10000,
          expires: 7,
          allowed_types: ['image/*']
        }
      ]
    }
  }

  FBUserFileStoreClientStub.resetHistory()
  await storeUploadedFiles(userData, uploadedResults)

  const policyArgs = FBUserFileStoreClientStub.getCall(0).args[1].policy

  t.deepEqual(policyArgs.max_size, 10000, 'it should set the max_size policy property')
  t.deepEqual(policyArgs.expires, 7, 'it should set the expires policy property')
  t.deepEqual(policyArgs.allowed_types, ['image/*'], 'it should set the allowed_types policy property')
  t.end()
  FBUserFileStoreClientStub.resetHistory()
})

test('When storeUploadedFiles encounters an error uploading a file', async t => {
  const uploadedResults = {
    files: {
      'test[1]': [
        {
          fieldname: 'test[1]',
          originalname: 'originalname',
          size: 6000,
          path: '/tmp/uploadedfilehash',
          maxSize: 10 * 1024 * 1024,
          type: 'image/monkey'
        }
      ]
    }
  }

  FBUserFileStoreClientStub.restore()
  FBUserFileStoreClientStub = stub(userFileStoreClient, 'storeFromPath')
  FBUserFileStoreClientStub.callsFake(async (file) => {
    const requestError = new Error('AWS Bill not paid')
    requestError.code = 500
    throw requestError
  })
  setUserDataPropertyStub.resetHistory()
  const fileErrors = await storeUploadedFiles(userData, uploadedResults)

  t.deepEqual(fileErrors, {
    UPLOAD_FAILED: [{
      fieldname: 'test[1]',
      originalname: 'originalname',
      errorMessage: 'AWS Bill not paid',
      errorCode: 500,
      errorType: 'Error',
      maxSize: 10 * 1024 * 1024,
      size: 6000,
      type: 'image/monkey'
    }]
  }, 'it should set an error noting that the attempt to file store failed')

  t.deepEqual(setUserDataPropertyStub.notCalled, true, 'it should not update the user data property')

  t.deepEqual(fsUnlinkStub.getCall(0).args[0], '/tmp/uploadedfilehash', 'it should delete the file even though it has not been uploaded')

  t.end()
  setUserDataPropertyStub.resetHistory()
  fsUnlinkStub.resetHistory()
  FBUserFileStoreClientStub.resetHistory()
})

test('When storeUploadedFiles finds a file in its list matches a slot marked for removal', async t => {
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

  const getBodyInputStub = stub(userData, 'getBodyInput')
  getBodyInputStub.callsFake(() => ({
    removeSlot: 'test[1]'
  }))
  const fileErrors = await storeUploadedFiles(userData, uploadedResults)

  t.equal(fileErrors, undefined, 'it should not set any errors')
  t.equal(FBUserFileStoreClientStub.notCalled, true, 'it should not atrempt to store any file in the slot')

  t.end()
  setUserDataPropertyStub.resetHistory()
  fsUnlinkStub.resetHistory()
  FBUserFileStoreClientStub.resetHistory()
})
