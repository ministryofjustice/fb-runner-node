require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const serviceData = require('~/fb-runner-node/service-data/service-data')
const getStringStub = stub(serviceData, 'getString')
const getInstancePropertyStub = stub(serviceData, 'getInstanceProperty')

const utilsUploads = require('~/fb-runner-node/page/utils/utils-uploads')
const getComponentFilesStub = stub(utilsUploads, 'getComponentFiles')

const setUploads = proxyquire('./set-uploads', {
  '~/fb-runner-node/service-data/service-data': serviceData,
  '~/fb-runner-node/page/utils/utils-uploads': utilsUploads
})

const setUploadInstancePropertyValues = (values) => {
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

const defaultUploadStringValues = {
  'upload.file.button.add': 'Add another file',
  'upload.file.button.remove': 'Remove button',
  'upload.file.description': 'Filename:{filename} Filetype:{filetype} Size:{size}',
  'upload.files.heading': '{count, select, 1{Already uploaded one} other{Already uploaded multiple}}',
  'upload.hint': 'default hint string',
  'upload.hint.timing': 'default timing string',
  'upload.hint.type.bar': 'Bar',
  'upload.hint.type.snack': 'Snax',
  'upload.hint.type.snack.falafel': 'Falafelly goodness',
  'upload.slot.button.remove': 'Remove {label}',
  'upload.slot.label': 'Slot label {count}'
}

const setUploadStringValues = (values) => {
  values = Object.assign(defaultUploadStringValues, values)
  return (id) => values[id]
}

const defaultUploadHint = 'default hint string'

function getUserDataMethods () {
  return {
    getBodyInput () { return {} },
    getUserData () { return {} },
    getUserDataProperty () { return {} },
    getSuccessfulUploadsCount () { return 0 }
  }
}

const setupUserDataStubs = (options = {}) => {
  const files = options.files || []
  const strings = options.strings
  const properties = options.properties
  const body = options.body || {}
  const userData = getUserDataMethods()

  getComponentFilesStub.callsFake(() => files)

  const getSuccessfulUploadsCountStub = stub(userData, 'getSuccessfulUploadsCount')
  getSuccessfulUploadsCountStub.callsFake(() => files.length)

  const getBodyInputStub = stub(userData, 'getBodyInput')
  getBodyInputStub.returns(body)

  const getUserDataStub = stub(userData, 'getUserData')
  getUserDataStub.returns({})

  getStringStub.callsFake(setUploadStringValues(strings))

  getInstancePropertyStub.callsFake(setUploadInstancePropertyValues(properties))

  return {
    userData,
    stubs: {
      getString: getStringStub,
      getInstancePropert: getInstancePropertyStub,
      getComponentFiles: getComponentFilesStub,
      getSuccessfulUploadsCount: getSuccessfulUploadsCountStub
    }
  }
}

const resetGlobalStubs = (userData) => {
  getComponentFilesStub.restore()
  getStringStub.restore()
  getInstancePropertyStub.restore()
  Object.keys(userData).forEach(key => {
    const method = userData[key]
    if (method.restore && typeof method === 'function') {
      method.restore()
    }
  })
}

const getUploadInstances = async (pageInstance, userData) => {
  pageInstance = await setUploads(pageInstance, userData)

  const {
    components: [
      control
    ] = []
  } = pageInstance

  return control
}

const getPageInstanceWithUploadComponent = (props) => {
  const component = Object.assign({
    _id: 'foo',
    _type: 'upload',
    name: 'foo',
    label: 'Foo label'
  }, props)
  return {
    _id: 'page.upload',
    components: [component]
  }
}

test.only('Setting up "single" type uploads and no files have been uploaded', async t => {
  const {userData} = setupUserDataStubs()

  const pageInstance = getPageInstanceWithUploadComponent({})

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(control.label, 'Foo label', 'does not change the label')
  t.equal(control.hint, defaultUploadHint, 'sets the default hint')
  t.equal(control.accept, undefined, 'does not set the accept property')

  t.equal(fileUpload.$skipValidation, true, 'sets `$skipValidation` to true')
  t.equal(fileUpload.$originalName, 'foo', 'assigns the control’s original name to a field')
  t.equal(fileUpload.name, 'foo[1]', 'assigns the control’s name to a field')

  resetGlobalStubs(userData)
  t.end()
})

test('Setting up "multiple" type uploads and no files have been uploaded', async t => {
  const {userData} = setupUserDataStubs()

  const pageInstance = getPageInstanceWithUploadComponent({maxFiles: 3})

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(control.label, 'Foo label', 'does not change the label')
  t.equal(control.hint, defaultUploadHint, 'sets the default hint')
  t.equal(control.accept, undefined, 'does not set the accept property')

  t.equal(fileUpload.$skipValidation, true, 'sets `$skipValidation` to true')
  t.equal(fileUpload.$originalName, 'foo', 'assigns the control’s original name to a field')
  t.equal(fileUpload.name, 'foo[1]', 'assigns the control’s name to a field')

  resetGlobalStubs(userData)
  t.end()
})

test('Setting up a single upload', async t => {
  const {userData} = setupUserDataStubs()

  const pageInstance = getPageInstanceWithUploadComponent()

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(fileUpload.label, 'Foo label', 'sets the label for the upload')
  t.equal(fileUpload.hint, defaultUploadHint, 'sets the hint for the upload')

  resetGlobalStubs(userData)
  t.end()
})

test('Setting up a multiple upload and only 1 slot is required', async t => {
  const {userData} = setupUserDataStubs()

  const pageInstance = getPageInstanceWithUploadComponent({maxFiles: 3})

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(fileUpload.label, 'Foo label', 'sets the label for the upload')
  t.equal(fileUpload.hint, defaultUploadHint, 'sets the hint for the upload')

  resetGlobalStubs(userData)
  t.end()
})

/*
test('Setting up a multiple upload and multiple slots are required', async t => {
  const {userData} = setupUserDataStubs({
    body: {foo_slots: 2}
  })

  const pageInstance = getPageInstanceWithUploadComponent({maxFiles: 3})

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  const {fileUploads, fileUploads: [fileUploadOne, fileUploadTwo]} = await getUploadInstances(pageInstance, userData)

  t.equal(fileUploads.length, 2, 'assigns the number of slots to a field')

  t.equal(fileUploadOne.label, 'Foo label', 'sets the label for the first upload')
  t.equal(fileUploadTwo.label, 'Foo label', 'sets the label for the second upload')

  resetGlobalStubs(userData)
  t.end()
})
*/

const setupUserDataStubsWithUploadTypeHints = () => {
  return setupUserDataStubs({
    strings: {
      'upload.hint': '{types, or}',
      'upload.hint.timing': ''
    }
  })
}

test('An upload with an `accepts` field that is a type reference rather than a media type', async t => {
  const {userData} = setupUserDataStubsWithUploadTypeHints()

  const pageInstance = getPageInstanceWithUploadComponent({
    accept: ['bar']
  })

  const {control, fileUploads: [fileUpload]} = await getUploadInstances(pageInstance, userData)

  t.equal(control.accept, 'image/bar,application/foo', 'resolves type references')
  t.equal(fileUpload.hint, 'Bar', 'assigns a hint for the type to a field on the control')

  resetGlobalStubs(userData)

  t.end()
})

test('An upload with an `accepts` field that is a type reference rather than a media type', async t => {
  const {userData} = setupUserDataStubsWithUploadTypeHints()

  const pageInstance = getPageInstanceWithUploadComponent({
    accept: ['fake']
  })

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(control.accept, 'fake', 'resolves type references')
  t.equal(fileUpload.hint, 'fake', 'assigns a hint for the type to a field on the control')

  resetGlobalStubs(userData)
  t.end()
})

test('An upload with an `accepts` field that contains a media type', async t => {
  const {userData} = setupUserDataStubsWithUploadTypeHints()

  const pageInstance = getPageInstanceWithUploadComponent({
    accept: ['snack/falafel']
  })

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(control.accept, 'snack/falafel', 'sets the media type as-is')
  t.equal(fileUpload.hint, 'Falafelly goodness', 'assigns a hint for the type to a field on the control')

  resetGlobalStubs(userData)
  t.end()
})

test('An upload with an `accepts` field that contains a media type that has no hint', async t => {
  const {userData} = setupUserDataStubsWithUploadTypeHints()

  const pageInstance = getPageInstanceWithUploadComponent({
    accept: ['feast/gluttonous']
  })

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(fileUpload.hint, 'gluttonous', 'assigns the specific type as the hint for to a field on the control')

  resetGlobalStubs(userData)
  t.end()
})

test('An upload with an `accepts` field that is a catch-all media type', async t => {
  const {userData} = setupUserDataStubsWithUploadTypeHints()

  const pageInstance = getPageInstanceWithUploadComponent({
    accept: ['snack/*']
  })

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(control.accept, 'snack/*', 'sets the media type as-is')
  t.equal(fileUpload.hint, 'Snax', 'assigns a hint for the type to a field on the control')

  resetGlobalStubs(userData)
  t.end()
})

test('An upload with an `accepts` field that contains a catch-all media type that has no hint', async t => {
  const {userData} = setupUserDataStubsWithUploadTypeHints()

  const pageInstance = getPageInstanceWithUploadComponent({
    accept: ['feast/*']
  })

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(fileUpload.hint, 'feast', 'assigns the generic type as the hint for to a field on the control')

  resetGlobalStubs(userData)
  t.end()
})

test('An upload with an multiple accept values', async t => {
  const {userData} = setupUserDataStubsWithUploadTypeHints()

  const pageInstance = getPageInstanceWithUploadComponent({
    accept: ['bar', 'snack/falafel', 'snack/*']
  })

  const control = await getUploadInstances(pageInstance, userData)
  const {
    fileUpload
  } = control

  t.equal(control.accept, 'image/bar,application/foo,snack/falafel,snack/*', 'resolves type references')
  t.equal(fileUpload.hint, 'Bar, Falafelly goodness or Snax', 'assigns the hints to a field on the control')

  resetGlobalStubs(userData)
  t.end()
})
