require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const {FBTest} = require('@ministryofjustice/fb-utils-node')
const {stubModule, resetStubsHistory} = FBTest()

const multerStub = stubModule('multer', () => {
  this.fields = () => {
    return (req, res, cb) => {
      req.body = {
        field: 'value'
      }
      req.files = ['a', 'b']
      req.bodyErrors = {}
      req.bodyErrors.files = ['x', 'y']
      cb()
    }
  }
  return this
})

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getStringStub = stub(serviceData, 'getString')
getStringStub.callsFake(() => 'Successfully removed {filename}')

const {getUserDataMethods} = require('~/fb-runner-node/middleware/user-data/user-data')

const processUploadControls = proxyquire('./process-upload-controls', {
  multer: multerStub
})

test('When processUploadControls is called', async t => {
  const userData = {
    req: {
      body: {}
    },
    setBodyInput: () => {},
    getBodyInput: () => ({})
  }

  const setBodyInputStub = stub(userData, 'setBodyInput')
  setBodyInputStub.callsFake(() => {})

  const uploadControls = [{
    _type: 'fileupload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedUploadControls = [{fieldname: 'test[1]', maxCount: 1}]
  const {files, fileErrors} = await processUploadControls(userData, uploadControls, allowedUploadControls)

  t.plan(4)
  t.deepEqual(files, ['a', 'b'], 'it should return the files parsed by multer')
  t.deepEqual(fileErrors, ['x', 'y'], 'it should return the errors determined by multer')

  t.equal(setBodyInputStub.called, true, 'it should call userData.setBodyInput')
  t.deepEqual(setBodyInputStub.getCall(0).args[0], {field: 'value'}, 'it should call userData.setBodyInput')

  t.end()
  resetStubsHistory()
})

test('When removing a file', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = stub(userData, 'getUserDataProperty')
  getUserDataPropertyStub.callsFake(() => {
    return [{
      originalname: 'originalname',
      uuid: 'bar'
    }]
  })
  const unsetUserDataPropertyStub = stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = stub(userData, 'setUserDataProperty')
  const setFlashMessageStub = stub(userData, 'setFlashMessage')

  const uploadControls = [{
    _type: 'fileupload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedUploadControls = [{fieldname: 'test[1]', maxCount: 1}]
  await processUploadControls(userData, uploadControls, allowedUploadControls)

  t.plan(4)
  t.deepEqual(getUserDataPropertyStub.getCall(0).args, ['foo'], 'it should retrieve the correct user data property')
  t.deepEqual(unsetUserDataPropertyStub.getCall(0).args, ['foo'], 'it should unset the correct user data property')
  t.ok(setUserDataPropertyStub.notCalled, 'it should not set the user data property')

  const setFlashMessageStubArgs = setFlashMessageStub.getCall(0).args
  t.deepEqual(setFlashMessageStubArgs[0], {
    type: 'file.removed',
    html: 'Successfully removed originalname'
  }, 'it should set a flash message for the upload')

  t.end()
})

test('When removing a file when a property has multiple files', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = stub(userData, 'getUserDataProperty')
  getUserDataPropertyStub.callsFake(() => {
    return [{
      uuid: 'bar'
    }, {
      uuid: 'baz'
    }]
  })
  const unsetUserDataPropertyStub = stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = stub(userData, 'setUserDataProperty')

  const uploadControls = [{
    _type: 'fileupload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedUploadControls = [{fieldname: 'test[1]', maxCount: 1}]
  await processUploadControls(userData, uploadControls, allowedUploadControls)

  t.plan(3)
  t.deepEqual(getUserDataPropertyStub.getCall(0).args, ['foo'], 'it should retrieve the correct user data property')
  t.deepEqual(setUserDataPropertyStub.getCall(0).args, ['foo', [{uuid: 'baz'}]], 'it should set the user data property')
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the user data property')

  t.end()
})

test('When attempting to remove a file that does not exist', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = stub(userData, 'getUserDataProperty')
  const unsetUserDataPropertyStub = stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = stub(userData, 'setUserDataProperty')

  const uploadControls = [{
    _type: 'fileupload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedUploadControls = [{fieldname: 'test[1]', maxCount: 1}]
  await processUploadControls(userData, uploadControls, allowedUploadControls)

  t.plan(3)
  t.deepEqual(getUserDataPropertyStub.getCall(0).args, ['foo'], 'it should retrieve the correct user data property')
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the user data property')
  t.ok(setUserDataPropertyStub.notCalled, 'it should not set the user data property')

  t.end()
})
