const test = require('tape')
const {stub} = require('sinon')

const getAllowedUploadControls = require('./get-allowed-upload-controls')

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

const uploadControlsMaxFiles = [{
  name: 'test',
  maxFiles: 2
}]
const uploadControlsNoMaxFiles = [{
  name: 'test'
}]
const uploadControlsMultiple = [{
  name: 'test',
  maxFiles: 2
}, {
  name: 'anothertest'
}]

test('When getAllowedUploadControls considers a control that has no maxFiles and no current uploaded files', t => {
  const alloweduploadControls = getAllowedUploadControls(userData, uploadControlsNoMaxFiles)

  t.deepEqual(alloweduploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }], 'it should return one available slot for the control')

  t.end()
})

test('When getAllowedUploadControls considers a control that has no maxFiles and no current uploaded files', t => {
  const userDataStub = stub(userData, 'getUserDataProperty')
  userDataStub.callsFake(fakeGetUserDataProperty(1))

  const alloweduploadControls = getAllowedUploadControls(userData, uploadControlsNoMaxFiles)

  t.deepEqual(alloweduploadControls, [], 'it should return no available slots for the control')

  t.end()
  userDataStub.restore()
})

test('When getAllowedUploadControls considers a control that has maxFiles and no current uploaded files', t => {
  const alloweduploadControls = getAllowedUploadControls(userData, uploadControlsMaxFiles)

  t.deepEqual(alloweduploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }, {
    name: 'test[2]',
    maxCount: 1
  }], 'it should return the correct number of available slots for the control')

  t.end()
})

test('When getAllowedUploadControls considers a control that has maxFiles and some uploaded files', t => {
  const userDataStub = stub(userData, 'getUserDataProperty')
  userDataStub.callsFake(fakeGetUserDataProperty(1))

  const alloweduploadControls = getAllowedUploadControls(userData, uploadControlsMaxFiles)

  t.deepEqual(alloweduploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }], 'it should return the correct number of available slots for the control')

  t.end()
  userDataStub.restore()
})

test('When getAllowedUploadControls considers multiple controls and there are no current uploaded files', t => {
  const alloweduploadControls = getAllowedUploadControls(userData, uploadControlsMultiple)

  t.deepEqual(alloweduploadControls, [{
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

test('When getAllowedUploadControls considers multiple controls and there are some uploaded files', t => {
  const userDataStub = stub(userData, 'getUserDataProperty')
  userDataStub.callsFake(fakeGetUserDataProperty(1))

  const alloweduploadControls = getAllowedUploadControls(userData, uploadControlsMultiple)

  t.deepEqual(alloweduploadControls, [{
    name: 'test[1]',
    maxCount: 1
  }], 'it should return the correct number of available slots for the control')

  t.end()
  userDataStub.restore()
})
