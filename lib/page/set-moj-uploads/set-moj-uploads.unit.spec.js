require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getStringStub = stub(serviceData, 'getString')
const getInstancePropertyStub = stub(serviceData, 'getInstanceProperty')

const uploadUtils = require('~/fb-runner-node/page/utils/utils-uploads')
const getUploadFilesStub = stub(uploadUtils, 'getUploadFiles')

const setMOJUploads = proxyquire('./set-moj-uploads', {
  '~/fb-runner-node/service-data/service-data': serviceData,
  '~/fb-runner-node/page/utils/utils-uploads': uploadUtils
})

const setMOJUploadInstancePropertyValues = (values) => {
  values = Object.assign({
    'filetype.foo': {
      types: ['application/foo']
    },
    'filetype.bar': {
      types: ['image/bar', 'foo']
    }
  }, values)
  return (id, property) => values[id] ? values[id][property] : undefined
}

const defaultMOJUploadStringValues = {
  'mojUpload.file.button.add': 'Add another file',
  'mojUpload.file.button.remove': 'Remove button',
  'mojUpload.file.description': 'Filename:{filename} Filetype:{filetype} Size:{size}',
  'mojUpload.files.heading': '{count, select, 1{Already uploaded one} other{Already uploaded multiple}}',
  'mojUpload.hint': 'default hint string',
  'mojUpload.hint.timing': 'default timing string',
  'mojUpload.hint.type.bar': 'Bar',
  'mojUpload.hint.type.snack': 'Snax',
  'mojUpload.hint.type.snack.falafel': 'Falafelly goodness',
  'mojUpload.slot.button.remove': 'Remove {label}',
  'mojUpload.slot.label': 'Slot label {count}'
}

const setMOJUploadStringValues = (values) => {
  values = Object.assign(defaultMOJUploadStringValues, values)
  return (id) => values[id]
}

const defaultMOJUploadHint = `${defaultMOJUploadStringValues['mojUpload.hint']}\n\n${defaultMOJUploadStringValues['mojUpload.hint.timing']}`

const getUserDataMethods = () => {
  return {
    getBodyInput: () => ({}),
    getUserDataProperty: () => {},
    getSuccessfulUploadsCount: () => 0
  }
}

const setupUserDataStubs = (options = {}) => {
  const files = options.files || []
  const strings = options.strings
  const properties = options.properties
  const body = options.body || {}
  const userData = getUserDataMethods()

  getUploadFilesStub.callsFake(() => files)

  const getSuccessfulUploadsCountStub = stub(userData, 'getSuccessfulUploadsCount')
  getSuccessfulUploadsCountStub.callsFake(() => files.length)

  const getBodyInputStub = stub(userData, 'getBodyInput')
  getBodyInputStub.callsFake(() => body)

  getStringStub.callsFake(setMOJUploadStringValues(strings))

  getInstancePropertyStub.callsFake(setMOJUploadInstancePropertyValues(properties))

  return {
    userData,
    stubs: {
      getString: getStringStub,
      getInstancePropert: getInstancePropertyStub,
      getUploadFiles: getUploadFilesStub,
      getSuccessfulUploadsCount: getSuccessfulUploadsCountStub
    }
  }
}

const resetGlobalStubs = (userData) => {
  getUploadFilesStub.restore()
  getStringStub.restore()
  getInstancePropertyStub.restore()
  Object.keys(userData).forEach(key => {
    const method = userData[key]
    if (method.restore && typeof method === 'function') {
      method.restore()
    }
  })
}

const getMOJUploadInstances = async (pageInstance, userData) => {
  const setMOJUploadsInstance = await setMOJUploads(pageInstance, userData)
  const uploadControl = setMOJUploadsInstance.components[0]
  const uploadSlots = uploadControl.fileUploads
  const uploadSummary = uploadControl.summaryList
  return {
    uploadControl,
    uploadSlots,
    uploadSummary
  }
}

const getPageInstanceWithMOJUploadComponent = (props) => {
  const component = Object.assign({
    _id: 'foo',
    _type: 'mojUpload',
    name: 'foo',
    label: 'Foo label'
  }, props)
  return {
    components: [component]
  }
}

const uploadTypes = {
  single: {},
  multiple: {
    maxFiles: 3
  }
}

Object.keys(uploadTypes).forEach(uploadType => {
  test(`When setting up a ${uploadType} MOJ file upload and no files have been uploaded`, async t => {
    const {userData} = setupUserDataStubs()

    const pageInstance = getPageInstanceWithMOJUploadComponent(uploadTypes[uploadType])

    const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
    const uploadSlot = uploadSlots[0]

    t.equal(uploadControl.label, 'Foo label', 'it should leave the label unchanged')
    t.equal(uploadControl.hint, defaultMOJUploadHint, 'it should set the default hint')
    t.equal(uploadControl.fileCount, 0, 'it should set the file count to 0')
    t.equal(uploadControl.summaryList.length, 0, 'it should add not items to the summaryList')
    t.equal(uploadControl.accept, undefined, 'it should not set the accept property if none had been set orginally')

    t.equal(uploadSlots.length, 1, 'it should prepare 1 upload slot')
    t.equal(uploadControl.slots, 1, 'it should set the number of slots the control needs to 1')

    t.equal(uploadSlot.$skipValidation, true, 'it should mark the upload slot as not requiring validation')
    t.equal(uploadSlot.$originalName, 'foo', 'it should record the control’s original name on the upload slot')
    t.equal(uploadSlot.name, 'foo[1]', 'it should set the correct name for the upload slot')

    resetGlobalStubs(userData)
    t.end()
  })
})

test('When setting up a single MOJ file upload', async t => {
  const {userData} = setupUserDataStubs()

  const pageInstance = getPageInstanceWithMOJUploadComponent()

  const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadSlot.label, 'Foo label', 'it should set the correct label for the upload slot')
  t.equal(uploadSlot.hint, defaultMOJUploadHint, 'it should set the correct hint for the upload slot')
  t.equal(uploadControl.addFile, undefined, 'it should not set the addFile property')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up a multiple MOJ file upload and only 1 slot is required', async t => {
  const {userData} = setupUserDataStubs()

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    maxFiles: 3
  })

  const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadSlot.label, undefined, 'it should not set a label for the upload slot')
  t.equal(uploadSlot.hint, undefined, 'it should not set the correct hint for the upload slot')
  t.equal(uploadControl.addFile, 'Add another file', 'it should set the addFile property')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up a multiple MOJ file upload and multiple slots are required', async t => {
  const {userData} = setupUserDataStubs({
    body: {foo_slots: 2}
  })

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    maxFiles: 3
  })

  const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)

  t.equal(uploadSlots.length, 2, 'it should set the requested number of upload slots')
  t.equal(uploadSlots[0].label, 'Slot label 1', 'it should set the label for the first upload slot')
  t.equal(uploadSlots[0].removeSlot, 'Remove Slot label 1', 'it should set remove button text for the first upload slot')
  t.equal(uploadSlots[1].label, 'Slot label 2', 'it should set the label for the next upload slot')
  t.equal(uploadSlots[1].removeSlot, 'Remove Slot label 2', 'it should set remove button text for the next upload slot')
  t.equal(uploadControl.addFile, 'Add another file', 'it should set the addFile property')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up a multiple MOJ file upload and as many slots as are available are required', async t => {
  const {userData} = setupUserDataStubs({
    body: {foo_slots: 3}
  })

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    maxFiles: 3
  })

  const {uploadControl} = await getMOJUploadInstances(pageInstance, userData)

  t.equal(uploadControl.addFile, undefined, 'it should not set the addFile property')

  resetGlobalStubs(userData)
  t.end()
})

test('When a user asks for an additional upload slot and no slots already exist', async t => {
  const {userData} = setupUserDataStubs({
    body: {addFile: 'foo'}
  })

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    maxFiles: 3
  })

  const {uploadSlots} = await getMOJUploadInstances(pageInstance, userData)

  t.equal(uploadSlots.length, 2, 'it should increase the number of upload slots to 2')

  resetGlobalStubs(userData)
  t.end()
})

test('When a user asks for an additional upload slot and a slot already exists but the maximum number of slots has not been reached', async t => {
  const {userData} = setupUserDataStubs({
    body: {
      foo_slots: 2,
      addFile: 'foo'
    }
  })

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    maxFiles: 3
  })

  const {uploadSlots} = await getMOJUploadInstances(pageInstance, userData)

  t.equal(uploadSlots.length, 3, 'it should increase the number of upload slots')

  resetGlobalStubs(userData)
  t.end()
})

test('When a user asks for an additional upload slot and a slot already exists but the maximum number of slots has been reached', async t => {
  const {userData} = setupUserDataStubs({
    body: {
      foo_slots: 3,
      addFile: 'foo'
    }
  })

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    maxFiles: 3
  })

  const {uploadSlots} = await getMOJUploadInstances(pageInstance, userData)

  t.equal(uploadSlots.length, 3, 'it should not increase the number of upload slots')

  resetGlobalStubs(userData)
  t.end()
})

test('When a user asks for an MOJ upload slot to be removed', async t => {
  const {userData} = setupUserDataStubs({
    body: {
      foo_slots: 2,
      removeSlot: 'foo[1]'
    }
  })

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    maxFiles: 3
  })

  const {uploadSlots} = await getMOJUploadInstances(pageInstance, userData)

  t.equal(uploadSlots.length, 1, 'it should decrease the number of upload slots')

  resetGlobalStubs(userData)
  t.end()
})

test('When a user asks for an MOJ upload slot to be removed but this would make the number of slots lower than the minimum', async t => {
  const {userData} = setupUserDataStubs({
    body: {
      foo_slots: 2,
      removeSlot: 'foo[1]'
    }
  })

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    maxFiles: 3,
    minFiles: 2
  })

  const {uploadSlots} = await getMOJUploadInstances(pageInstance, userData)

  t.equal(uploadSlots.length, 2, 'it should not decrease the number of upload slots')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up a MOJ file upload which has a file already uploaded', async t => {
  const {userData} = setupUserDataStubs({
    files: [{
      uuid: 'bar',
      size: 10 * 1024,
      mimetype: 'image/png',
      originalname: 'foo.png'
    }]
  })

  const pageInstance = getPageInstanceWithMOJUploadComponent()

  const {uploadControl, uploadSummary} = await getMOJUploadInstances(pageInstance, userData)

  t.equal(uploadControl.summaryListHeading, 'Already uploaded one', 'it should set the heading for the summary list of uploaded files')

  t.equal(uploadSummary.length, 1, 'it should add the uploaded file to the summary list')
  const uploadDetails = uploadSummary[0]
  const uploadKey = uploadDetails.key
  t.equal(uploadKey.html, 'Filename:foo.png Filetype:png Size:10KB', 'it should set the text describing the uploaded file')
  t.equal(uploadKey.classes, 'fb-summary-list--file-key', 'it should set any classes needed for the text describing the uploaded file')

  const uploadActions = uploadDetails.actions.items
  t.equal(uploadActions.length, 1, 'it should add the the correct number of actions for the uploaded file')
  const uploadRemove = uploadActions[0]
  t.equal(uploadRemove.name, 'removeFile', 'it should set the name of the remove button for the uploaded file')
  t.equal(uploadRemove.value, 'foo:bar', 'it should set the value of the remove button for the uploaded file')
  t.equal(uploadRemove.html, 'Remove button', 'it should set the remove button text for the uploaded file')
  t.equal(uploadRemove.visuallyHiddenText, 'foo.png', 'it should set the name of the file as visually hidden text for the remove button for accessibility reasons')
  t.equal(uploadRemove.classes, 'govuk-button--secondary fb-action--delete', 'it should set any classes required for the remove button text for the uploaded file')

  resetGlobalStubs(userData)
  t.end()
})

const setupUserDataStubsWithMOJUploadTypeHints = () => {
  return setupUserDataStubs({
    strings: {
      'mojUpload.hint': '{types, or}',
      'mojUpload.hint.timing': ''
    }
  })
}

test('When setting up an MOJ upload with an accepts that is a type reference rather than a media-type', async t => {
  const {userData} = setupUserDataStubsWithMOJUploadTypeHints()

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    accept: ['bar']
  })

  const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadControl.accept, 'image/bar,application/foo', 'it should set resolve and expand any type references')
  t.equal(uploadSlot.hint, 'Bar', 'it should pass any matching hint for the type to the control')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up an MOJ upload with an accepts that is a type reference rather than a media-type', async t => {
  const {userData} = setupUserDataStubsWithMOJUploadTypeHints()

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    accept: ['fake']
  })

  const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadControl.accept, 'fake', 'it should set resolve and expand any type references')
  t.equal(uploadSlot.hint, 'fake', 'it should pass any matching hint for the type to the control')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up an MOJ upload with an accept that contains a media-type', async t => {
  const {userData} = setupUserDataStubsWithMOJUploadTypeHints()

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    accept: ['snack/falafel']
  })

  const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadControl.accept, 'snack/falafel', 'it should set the media-type as is')
  t.equal(uploadSlot.hint, 'Falafelly goodness', 'it should pass any matching hint for the type to the control')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up an MOJ upload with an accept that contains a media-type that has no hint', async t => {
  const {userData} = setupUserDataStubsWithMOJUploadTypeHints()

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    accept: ['feast/gluttonous']
  })

  const {uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadSlot.hint, 'gluttonous', 'it should pass the non-generic part of the type as the hint for the type to the control')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up an MOJ upload with an accepts that is a catch-all media-type', async t => {
  const {userData} = setupUserDataStubsWithMOJUploadTypeHints()

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    accept: ['snack/*']
  })

  const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadControl.accept, 'snack/*', 'it should set the media-type as is')
  t.equal(uploadSlot.hint, 'Snax', 'it should pass any matching hint for the type to the control')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up an MOJ upload with an accept that contains a catch-all media-type that has no hint', async t => {
  const {userData} = setupUserDataStubsWithMOJUploadTypeHints()

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    accept: ['feast/*']
  })

  const {uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadSlot.hint, 'feast', 'it should pass the generic type as the hint for the type to the control')

  resetGlobalStubs(userData)
  t.end()
})

test('When setting up an MOJ upload with an multiple accept values', async t => {
  const {userData} = setupUserDataStubsWithMOJUploadTypeHints()

  const pageInstance = getPageInstanceWithMOJUploadComponent({
    accept: ['bar', 'snack/falafel', 'snack/*']
  })

  const {uploadControl, uploadSlots} = await getMOJUploadInstances(pageInstance, userData)
  const uploadSlot = uploadSlots[0]

  t.equal(uploadControl.accept, 'image/bar,application/foo,snack/falafel,snack/*', 'it should set resolve and expand any type references')
  t.equal(uploadSlot.hint, 'Bar, Falafelly goodness or Snax', 'it should pass through all the accepted types to the hint')

  resetGlobalStubs(userData)
  t.end()
})