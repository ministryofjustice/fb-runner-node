require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

const sinon = require('sinon')

const bytesStub = sinon.stub()
const formatStub = sinon.stub()

const countComponentAcceptedFilesStub = sinon.stub()
const getComponentAcceptedFilesStub = sinon.stub()

const UploadController = proxyquire('.', {
  bytes: bytesStub,
  '~/fb-runner-node/format/format': {
    format: formatStub
  },
  '~/fb-runner-node/page/utils/utils-uploads': {
    countComponentAcceptedFiles: countComponentAcceptedFilesStub,
    getComponentAcceptedFiles: getComponentAcceptedFilesStub
  }
})

test('is answered', (t) => {
  countComponentAcceptedFilesStub.returns(1)

  const componentInstance = {}
  const userData = {}

  const uploadController = new UploadController()

  t.ok(uploadController.isAnswered(componentInstance, userData), 'returns true')

  t.end()
})

test('is not answered', (t) => {
  countComponentAcceptedFilesStub.returns(0)

  const componentInstance = {}
  const userData = {}

  const uploadController = new UploadController()

  t.notOk(uploadController.isAnswered(componentInstance, userData), 'returns false')

  t.end()
})

test('get answered display value', (t) => {
  getComponentAcceptedFilesStub.reset()

  bytesStub.reset()
  formatStub.reset()

  getComponentAcceptedFilesStub.returns([{originalname: 'mock original name', size: 'mock size'}])

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component'
  }

  const userData = {
    contentLang: 'mock content lang'
  }

  const uploadController = new UploadController()

  const isMultiLineStub = sinon.stub(uploadController, 'isMultiLine').returns(false)

  bytesStub.returns('mock bytes')

  t.equal(uploadController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock original name (mock bytes)'], 'gets is multiline')

  const {firstCall: {args: [id]}} = bytesStub
  t.equal(id, 'mock size', 'gets the bytes')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock original name (mock bytes)', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})
