require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const test = require('tape')
const sinon = require('sinon')

const bytesStub = sinon.stub()
const formatStub = sinon.stub()

const UploadController = proxyquire('.', {
  bytes: bytesStub,
  '~/fb-runner-node/format/format': {
    format: formatStub
  }
})

test('is answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns([{}])

  const componentInstance = {
    name: 'mock component'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const uploadController = new UploadController()

  t.ok(uploadController.isAnswered(componentInstance, userData), 'returns true')

  t.end()
})

test('is not answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns(undefined)

  const componentInstance = {
    name: 'mock component'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const uploadController = new UploadController()

  t.notOk(uploadController.isAnswered(componentInstance, userData), 'returns false')

  t.end()
})

test('get answered display value', (t) => {
  bytesStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns([{originalname: 'mock original name', size: 'mock size'}])

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
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
