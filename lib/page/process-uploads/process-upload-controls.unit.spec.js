require('@ministryofjustice/module-alias/register-module')(module)

const {
  test
} = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const multerStub = sinon.stub().returns({
  fields: () => {
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
})

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getStringStub = sinon.stub(serviceData, 'getString')

getStringStub.returns('Successfully removed {filename}')

const { getUserDataMethods } = require('~/fb-runner-node/middleware/user-data/user-data')

const processComponents = proxyquire('./process-upload-controls', {
  multer: multerStub
})

test('`processComponents` is called (fileupload)', async t => {
  const userData = {
    req: {
      body: {}
    },
    setBodyInput: () => {},
    getBodyInput: () => ({})
  }

  const setBodyInputStub = sinon.stub(userData, 'setBodyInput')
  setBodyInputStub.returns({})

  const components = [{
    _type: 'fileupload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedComponents = [{ fieldname: 'test[1]', maxCount: 1 }]
  const { files, fileErrors } = await processComponents(userData, components, allowedComponents)

  t.plan(4)
  t.deepEqual(files, ['a', 'b'], 'it should return the files parsed by multer')
  t.deepEqual(fileErrors, ['x', 'y'], 'it should return the errors determined by multer')

  t.equal(setBodyInputStub.called, true, 'it should call userData.setBodyInput')
  t.deepEqual(setBodyInputStub.getCall(0).args[0], { field: 'value' }, 'it should call userData.setBodyInput')

  t.end()
})

test('`processComponents` is called (upload)', async t => {
  const userData = {
    req: {
      body: {}
    },
    setBodyInput: () => {},
    getBodyInput: () => ({})
  }

  const setBodyInputStub = sinon.stub(userData, 'setBodyInput')
  setBodyInputStub.returns({})

  const components = [{
    _type: 'upload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedComponents = [{ fieldname: 'test[1]', maxCount: 1 }]
  const { files, fileErrors } = await processComponents(userData, components, allowedComponents)

  t.plan(4)
  t.deepEqual(files, ['a', 'b'], 'it should return the files parsed by multer')
  t.deepEqual(fileErrors, ['x', 'y'], 'it should return the errors determined by multer')

  t.equal(setBodyInputStub.called, true, 'it should call userData.setBodyInput')
  t.deepEqual(setBodyInputStub.getCall(0).args[0], { field: 'value' }, 'it should call userData.setBodyInput')

  t.end()
})

test('Removing an upload (fileupload) ', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = sinon.stub(userData, 'getUserDataProperty')
  getUserDataPropertyStub.returns([{
    originalname: 'originalname',
    uuid: 'bar'
  }])
  const unsetUserDataPropertyStub = sinon.stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = sinon.stub(userData, 'setUserDataProperty')
  const setFlashMessageStub = sinon.stub(userData, 'setFlashMessage')

  const components = [{
    _type: 'fileupload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedComponents = [{ fieldname: 'test[1]', maxCount: 1 }]
  await processComponents(userData, components, allowedComponents)

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

test('Removing an upload (upload) ', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = sinon.stub(userData, 'getUserDataProperty')
  getUserDataPropertyStub.returns([{
    originalname: 'originalname',
    uuid: 'bar'
  }])
  const unsetUserDataPropertyStub = sinon.stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = sinon.stub(userData, 'setUserDataProperty')
  const setFlashMessageStub = sinon.stub(userData, 'setFlashMessage')

  const components = [{
    _type: 'upload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedComponents = [{ fieldname: 'test[1]', maxCount: 1 }]
  await processComponents(userData, components, allowedComponents)

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

test('Removing an upload when a property has multiple uploads (fileupload)', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = sinon.stub(userData, 'getUserDataProperty')
  getUserDataPropertyStub.returns([{
    uuid: 'bar'
  }, {
    uuid: 'baz'
  }])
  const unsetUserDataPropertyStub = sinon.stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = sinon.stub(userData, 'setUserDataProperty')

  const components = [{
    _type: 'fileupload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedComponents = [{ fieldname: 'test[1]', maxCount: 1 }]
  await processComponents(userData, components, allowedComponents)

  t.plan(3)
  t.deepEqual(getUserDataPropertyStub.getCall(0).args, ['foo'], 'it should retrieve the correct user data property')
  t.deepEqual(setUserDataPropertyStub.getCall(0).args, ['foo', [{ uuid: 'baz' }]], 'it should set the user data property')
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the user data property')

  t.end()
})

test('Removing an upload when a property has multiple uploads (upload)', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = sinon.stub(userData, 'getUserDataProperty')
  getUserDataPropertyStub.returns([{
    uuid: 'bar'
  }, {
    uuid: 'baz'
  }])
  const unsetUserDataPropertyStub = sinon.stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = sinon.stub(userData, 'setUserDataProperty')

  const components = [{
    _type: 'upload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedComponents = [{ fieldname: 'test[1]', maxCount: 1 }]
  await processComponents(userData, components, allowedComponents)

  t.plan(3)
  t.deepEqual(getUserDataPropertyStub.getCall(0).args, ['foo'], 'it should retrieve the correct user data property')
  t.deepEqual(setUserDataPropertyStub.getCall(0).args, ['foo', [{ uuid: 'baz' }]], 'it should set the user data property')
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the user data property')

  t.end()
})

test('Trying to remove an upload which does not exist (fileupload)', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = sinon.stub(userData, 'getUserDataProperty')
  const unsetUserDataPropertyStub = sinon.stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = sinon.stub(userData, 'setUserDataProperty')

  const components = [{
    _type: 'fileupload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedComponents = [{ fieldname: 'test[1]', maxCount: 1 }]
  await processComponents(userData, components, allowedComponents)

  t.plan(3)
  t.deepEqual(getUserDataPropertyStub.getCall(0).args, ['foo'], 'it should retrieve the correct user data property')
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the user data property')
  t.ok(setUserDataPropertyStub.notCalled, 'it should not set the user data property')

  t.end()
})

test('Trying to remove an upload which does not exist (upload)', async t => {
  const userData = getUserDataMethods({})
  userData.req = {
    body: {}
  }
  userData.getBodyInput = () => ({
    removeFile: 'foo:bar'
  })
  const getUserDataPropertyStub = sinon.stub(userData, 'getUserDataProperty')
  const unsetUserDataPropertyStub = sinon.stub(userData, 'unsetUserDataProperty')
  const setUserDataPropertyStub = sinon.stub(userData, 'setUserDataProperty')

  const components = [{
    _type: 'upload',
    maxSize: 5 * 1024 * 1024
  }]
  const allowedComponents = [{ fieldname: 'test[1]', maxCount: 1 }]
  await processComponents(userData, components, allowedComponents)

  t.plan(3)
  t.deepEqual(getUserDataPropertyStub.getCall(0).args, ['foo'], 'it should retrieve the correct user data property')
  t.ok(unsetUserDataPropertyStub.notCalled, 'it should not unset the user data property')
  t.ok(setUserDataPropertyStub.notCalled, 'it should not set the user data property')

  t.end()
})
