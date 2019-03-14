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

const processUploadControls = proxyquire('./process-upload-controls', {
  multer: multerStub
})

const userData = {
  req: {
    body: {}
  },
  setBodyInput: () => {}
}

const setBodyInputStub = stub(userData, 'setBodyInput')
setBodyInputStub.callsFake(() => {})

test('When processUploadControls is called', async t => {
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
