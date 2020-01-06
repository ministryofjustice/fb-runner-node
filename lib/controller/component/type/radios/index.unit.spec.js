require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const test = require('tape')
const sinon = require('sinon')

const getInstanceTitleSummaryStub = sinon.stub()
const formatStub = sinon.stub()

const RadiosController = proxyquire('.', {
  '~/fb-runner-node/service-data/service-data': {
    getInstanceTitleSummary: getInstanceTitleSummaryStub
  },
  '~/fb-runner-node/format/format': {
    format: formatStub
  }
})

test('is answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns('mock radio is answered')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock radio item', value: 'mock radio is answered'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const radiosController = new RadiosController()

  t.ok(radiosController.isAnswered(componentInstance, userData), 'returns true')

  t.end()
})

test('is not answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns('mock radio is answered')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock radio item'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const radiosController = new RadiosController()

  t.notOk(radiosController.isAnswered(componentInstance, userData), 'returns false')

  t.end()
})

test('get answered display value', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock radio value')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock radio item name', _id: 'mock radio item id', value: 'mock radio value'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const radiosController = new RadiosController()

  const isMultiLineStub = sinon.stub(radiosController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(radiosController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock instance title summary'], 'gets is multiline')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock radio item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when there is more than one answer', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock radio value two')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component',
    items: [
      {
        name: 'mock radio item name one',
        _id: 'mock radio item id one',
        value: 'mock radio value one'
      },
      {
        name: 'mock radio item name two',
        _id: 'mock radio item id two',
        value: 'mock radio value two'
      }
    ]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const radiosController = new RadiosController()

  const isMultiLineStub = sinon.stub(radiosController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(radiosController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock instance title summary'], 'gets is multiline')

  const {firstCall: {args: [two]}} = getInstanceTitleSummaryStub
  t.equal(two, 'mock radio item id two', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})
