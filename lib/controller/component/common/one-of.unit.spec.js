require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

const sinon = require('sinon')

const getInstanceTitleSummaryStub = sinon.stub()
const formatStub = sinon.stub()

const OneOfController = proxyquire('./one-of', {
  '~/fb-runner-node/service-data/service-data': {
    getInstanceTitleSummary: getInstanceTitleSummaryStub
  },
  '~/fb-runner-node/format/format': {
    format: formatStub
  }
})

test('is answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns('mock oneOf is answered')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock oneOf item', value: 'mock oneOf is answered'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const oneOfController = new OneOfController()

  t.ok(oneOfController.isAnswered(componentInstance, userData), 'returns true')

  t.end()
})

test('is not answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns('mock oneOf is answered')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock oneOf item'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const oneOfController = new OneOfController()

  t.notOk(oneOfController.isAnswered(componentInstance, userData), 'returns false')

  t.end()
})

test('get answered display value', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock oneOf value')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock oneOf item name', _id: 'mock oneOf item id', value: 'mock oneOf value'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const oneOfController = new OneOfController()

  const isMultiLineStub = sinon.stub(oneOfController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(oneOfController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock instance title summary'], 'gets is multiline')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock oneOf item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when there is more than one answer', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock oneOf value two')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component',
    items: [
      {
        name: 'mock oneOf item name one',
        _id: 'mock oneOf item id one',
        value: 'mock oneOf value one'
      },
      {
        name: 'mock oneOf item name two',
        _id: 'mock oneOf item id two',
        value: 'mock oneOf value two'
      }
    ]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const oneOfController = new OneOfController()

  const isMultiLineStub = sinon.stub(oneOfController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(oneOfController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock instance title summary'], 'gets is multiline')

  const {firstCall: {args: [two]}} = getInstanceTitleSummaryStub
  t.equal(two, 'mock oneOf item id two', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})
