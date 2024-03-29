require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const { stub } = require('sinon')
const proxyquire = require('proxyquire')

const fs = require('fs')
const fsUnlinkStub = stub(fs, 'unlink')

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getStringStub = stub(serviceData, 'getString')
getStringStub.callsFake(() => 'Successfully uploaded {filename}')

const userFileStoreClient = require('~/fb-runner-node/client/user/filestore/filestore')
let FBUserFileStoreClientStub = stub(userFileStoreClient, 'storeFromPath')
FBUserFileStoreClientStub.callsFake(async (userId, userToken, file) => {
  return {
    fingerprint: 'fingerprint',
    timestamp: 1551372750086
  }
})
const logger = stub()
const pageInstance = {}
const userData = {
  getUserId () { return 'userid' },
  getUserToken () { return 'usertoken' },
  getBodyInput () { return {} },
  getUserDataProperty () { },
  setUserDataProperty () { },
  setFlashMessage () { },
  setSuccessfulUpload () { },
  logger
}
const setUserDataPropertyStub = stub(userData, 'setUserDataProperty')
const setSuccessfulUploadStub = stub(userData, 'setSuccessfulUpload')
const getComponentNameStub = stub()
const getComponentTypeStub = stub()
const uuid = require('uuid')
const uuidStub = stub(uuid, 'v4')
uuidStub.callsFake(() => 'uuid')

const storeUploadedFiles = proxyquire('./store-uploaded-files', {
  fs: fs,
  '~/fb-runner-node/page/utils/utils-controls': {
    getComponentName: getComponentNameStub,
    getComponentType: getComponentTypeStub
  },
  '~/fb-runner-node/client/user/filestore/filestore': userFileStoreClient,
  '~/fb-runner-node/service-data/service-data': serviceData
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

  getComponentNameStub.returns('mock component name')
  getComponentTypeStub.returns('upload')

  const fileErrors = await storeUploadedFiles(pageInstance, userData, uploadedResults)

  t.equal(fileErrors, undefined, 'it should not set any errors')

  const FBUserFileStoreClientStubArgs = FBUserFileStoreClientStub.getCall(0).args

  t.equal(FBUserFileStoreClientStubArgs[0], '/tmp/uploadedfilehash', 'it should call the storeFromPath method with the correct filepath')

  t.same(FBUserFileStoreClientStubArgs[1], {
    userId: 'userid',
    userToken: 'usertoken',
    policy: {}
  }, 'it should call the storeFromPath method with the correct user details')

  t.equal(FBUserFileStoreClientStubArgs[2], logger, 'it should call the storeFromPath method with any logger instance attached to the userData object')

  const setUserDataPropertyStubArgs = setUserDataPropertyStub.getCall(0).args

  t.same(setUserDataPropertyStubArgs[0], 'mock component name', 'it should update the correct user data property')

  t.same(setUserDataPropertyStubArgs[1], [
    {
      fieldname: 'test[1]',
      originalname: 'originalname',
      size: 10485760,
      path: '/tmp/uploadedfilehash',
      uuid: 'uuid',
      timestamp: 1551372750086,
      fingerprint: 'fingerprint',
      url: 'SUBMITTER_URL/service/SERVICE_SLUG/user/userid/fingerprint'
    }
  ], 'it should update the user data property with the correct file details')

  const setSuccessfulUploadStubArgs = setSuccessfulUploadStub.getCall(0).args

  t.same(setSuccessfulUploadStubArgs[0], 'mock component name', 'it should increment the field’s successful file upload count')

  t.same(fsUnlinkStub.getCall(0).args[0], '/tmp/uploadedfilehash', 'it should delete the file after it has been uploaded')

  t.end()

  setUserDataPropertyStub.resetHistory()
  fsUnlinkStub.resetHistory()
  FBUserFileStoreClientStub.resetHistory()

  getComponentNameStub.reset()
  getComponentTypeStub.reset()
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
  await storeUploadedFiles(pageInstance, userData, uploadedResults)

  const policyArgs = FBUserFileStoreClientStub.getCall(0).args[1].policy

  t.same(policyArgs.max_size, 10000, 'it should set the max_size policy property')
  t.same(policyArgs.expires, 7, 'it should set the expires policy property')
  t.same(policyArgs.allowed_types, ['image/*'], 'it should set the allowed_types policy property')
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
  const fileErrors = await storeUploadedFiles(pageInstance, userData, uploadedResults)

  t.same(fileErrors, {
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

  t.same(setUserDataPropertyStub.notCalled, true, 'it should not update the user data property')

  t.same(fsUnlinkStub.getCall(0).args[0], '/tmp/uploadedfilehash', 'it should delete the file even though it has not been uploaded')

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
  const fileErrors = await storeUploadedFiles(pageInstance, userData, uploadedResults)

  t.equal(fileErrors, undefined, 'it should not set any errors')
  t.equal(FBUserFileStoreClientStub.notCalled, true, 'it should not atrempt to store any file in the slot')

  t.end()
  setUserDataPropertyStub.resetHistory()
  fsUnlinkStub.resetHistory()
  FBUserFileStoreClientStub.resetHistory()
})
