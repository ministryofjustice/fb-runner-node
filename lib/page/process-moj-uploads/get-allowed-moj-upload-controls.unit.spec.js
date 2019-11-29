const test = require('tape')
const {stub} = require('sinon')

const getAllowedMOJUploadControls = require('./get-allowed-moj-upload-controls')

const userData = {}
userData.getUserDataProperty = () => undefined
const fakeGetUserDataProperty = (count) => {
  let returnValue
  if (count !== undefined) {
    const propArray = []
    propArray.length = count
    returnValue = propArray
  }
  return () => returnValue
}

const mojUploadControlsMaxFiles = [{
  name: 'test',
  maxFiles: 2
}]
const mojUploadControlsNoMaxFiles = [{
  name: 'test'
}]
const mojUploadControlsMultiple = [{
  name: 'test',
  maxFiles: 2
}, {
  name: 'anothertest'
}]

test('When getAllowedMOJUploadControls considers a control that has no maxFiles and no current uploaded files', t => {
  const allowedMojUploadControls = getAllowedMOJUploadControls(userData, mojUploadControlsNoMaxFiles)

  t.deepEqual(allowedMojUploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }], 'it should return one available slot for the control')

  t.end()
})

test('When getAllowedMOJUploadControls considers a control that has no maxFiles and no current uploaded files', t => {
  const userDataStub = stub(userData, 'getUserDataProperty')
  userDataStub.callsFake(fakeGetUserDataProperty(1))

  const allowedMojUploadControls = getAllowedMOJUploadControls(userData, mojUploadControlsNoMaxFiles)

  t.deepEqual(allowedMojUploadControls, [], 'it should return no available slots for the control')

  t.end()
  userDataStub.restore()
})

test('When getAllowedMOJUploadControls considers a control that has maxFiles and no current uploaded files', t => {
  const allowedMojUploadControls = getAllowedMOJUploadControls(userData, mojUploadControlsMaxFiles)

  t.deepEqual(allowedMojUploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }, {
    name: 'test[2]',
    maxCount: 1
  }], 'it should return the correct number of available slots for the control')

  t.end()
})

test('When getAllowedMOJUploadControls considers a control that has maxFiles and some uploaded files', t => {
  const userDataStub = stub(userData, 'getUserDataProperty')
  userDataStub.callsFake(fakeGetUserDataProperty(1))

  const allowedMojUploadControls = getAllowedMOJUploadControls(userData, mojUploadControlsMaxFiles)

  t.deepEqual(allowedMojUploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }], 'it should return the correct number of available slots for the control')

  t.end()
  userDataStub.restore()
})

test('When getAllowedMOJUploadControls considers multiple controls and there are no current uploaded files', t => {
  const allowedMojUploadControls = getAllowedMOJUploadControls(userData, mojUploadControlsMultiple)

  t.deepEqual(allowedMojUploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }, {
    name: 'test[2]',
    maxCount: 1
  }, {
    name: 'anothertest[1]',
    maxCount: 1
  }], 'it should return the correct number of available slots for the control')

  t.end()
})

test('When getAllowedMOJUploadControls considers multiple controls and there are some uploaded files', t => {
  const userDataStub = stub(userData, 'getUserDataProperty')
  userDataStub.callsFake(fakeGetUserDataProperty(1))

  const allowedMojUploadControls = getAllowedMOJUploadControls(userData, mojUploadControlsMultiple)

  t.deepEqual(allowedMojUploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }], 'it should return the correct number of available slots for the control')

  t.end()
  userDataStub.restore()
})
