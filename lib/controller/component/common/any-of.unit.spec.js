require('@ministryofjustice/module-alias/register-module')(module)

const proxyquire = require('proxyquire')

const {
  test
} = require('tap')

const sinon = require('sinon')

const getInstanceTitleSummaryStub = sinon.stub()
const formatStub = sinon.stub()

const AnyOfController = proxyquire('./any-of', {
  '~/fb-runner-node/service-data/service-data': {
    getInstanceTitleSummary: getInstanceTitleSummaryStub
  },
  '~/fb-runner-node/format/format': {
    format: formatStub
  }
})

test('is answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns('mock anyOf is answered')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock anyOf item', value: 'mock anyOf is answered'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const anyOfController = new AnyOfController()

  t.ok(anyOfController.isAnswered(componentInstance, userData), 'returns true')

  t.end()
})

test('is not answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns('mock anyOf is answered')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock anyOf item'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const anyOfController = new AnyOfController()

  t.notOk(anyOfController.isAnswered(componentInstance, userData), 'returns false')

  t.end()
})

test('is redacted', (t) => {
  const isRedactedStub = sinon.stub(AnyOfController.prototype, 'isRedacted').returns('mock return value')

  const anyOfController = new AnyOfController()

  const componentInstance = {}
  const userData = {}

  t.equal(anyOfController.isRedacted(componentInstance, userData), 'mock return value', 'returns the value from super')

  t.deepEqual(isRedactedStub.firstCall.args, [componentInstance, userData], 'calls super')

  isRedactedStub.restore()

  t.end()
})

test('is answered item when the instance title summary is defined', (t) => {
  getInstanceTitleSummaryStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock anyOf is answered')

  const componentInstance = {
    name: 'mock component', _id: 'mock anyOf item id'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const anyOfController = new AnyOfController()

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.ok(anyOfController.isAnsweredItem(componentInstance, userData), 'returns true')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  t.end()
})

test('is answered item when the instance title summary is not defined and the anyOf value is defined', (t) => {
  getInstanceTitleSummaryStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock anyOf is answered')

  const componentInstance = {
    name: 'mock component', _id: 'mock anyOf item id', value: 'mock anyOf item value'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const anyOfController = new AnyOfController()

  getInstanceTitleSummaryStub.returns(undefined)

  t.ok(anyOfController.isAnsweredItem(componentInstance, userData), 'returns true')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  t.end()
})

test('is answered item when the instance title summary is not defined and the anyOf value is not defined', (t) => {
  getInstanceTitleSummaryStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock anyOf is answered')

  const componentInstance = {
    name: 'mock component', _id: 'mock anyOf item id'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const anyOfController = new AnyOfController()

  getInstanceTitleSummaryStub.returns(undefined)

  t.notOk(anyOfController.isAnsweredItem(componentInstance, userData), 'returns false')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  t.end()
})

test('is redacted item', (t) => {
  const isRedactedStub = sinon.stub(AnyOfController.prototype, 'isRedacted').returns('mock return value')

  const anyOfController = new AnyOfController()

  const componentInstanceItem = {}
  const userData = {}

  t.equal(anyOfController.isRedactedItem(componentInstanceItem, userData), 'mock return value', 'returns the value from super')

  t.deepEqual(isRedactedStub.firstCall.args, [componentInstanceItem, userData], 'calls super')

  isRedactedStub.restore()

  t.end()
})

test('get answered display value when the instance title summary is defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock anyOf value')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock anyOf item name', _id: 'mock anyOf item id', value: 'mock anyOf value'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  const isMultiLineStub = sinon.stub(anyOfController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(anyOfController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock instance title summary'], 'gets is multiline')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is not defined and the anyOf value is defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock anyOf value')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock anyOf item name', _id: 'mock anyOf item id', value: 'mock anyOf value'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  const isMultiLineStub = sinon.stub(anyOfController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(anyOfController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock anyOf value'], 'gets is multiline')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock anyOf value', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is not defined and the anyOf value is not defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('yes')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock anyOf item name', _id: 'mock anyOf item id'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  const isMultiLineStub = sinon.stub(anyOfController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(anyOfController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, ''], 'gets is multiline')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is defined and there is more than one answer', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub()

  getUserDataInputPropertyStub.onCall(0).returns('mock anyOf value one')
  getUserDataInputPropertyStub.onCall(1).returns('mock anyOf value two')

  formatStub.returns('<p>mock formatted value</p>')

  const componentInstance = {
    name: 'mock component',
    items: [
      {
        name: 'mock anyOf item name one',
        _id: 'mock anyOf item id one',
        value: 'mock anyOf value one'
      },
      {
        name: 'mock anyOf item name two',
        _id: 'mock anyOf item id two',
        value: 'mock anyOf value two'
      }
    ]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  const isMultiLineStub = sinon.stub(anyOfController, 'isMultiLine').returns(true)

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(anyOfController.getAnsweredDisplayValue(componentInstance, userData), '<p class="govuk-body">mock formatted value</p>', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock instance title summary\n\nmock instance title summary'], 'gets is multiline')

  const {firstCall: {args: [one]}} = getInstanceTitleSummaryStub
  t.equal(one, 'mock anyOf item id one', 'gets the instance title summary')

  const {secondCall: {args: [two]}} = getInstanceTitleSummaryStub
  t.equal(two, 'mock anyOf item id two', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary\n\nmock instance title summary', {}, {multiline: true, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is not defined and the anyOf value is defined and there is more than one answer', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub()

  getUserDataInputPropertyStub.onCall(0).returns('mock anyOf value one')
  getUserDataInputPropertyStub.onCall(1).returns('mock anyOf value two')

  formatStub.returns('<p>mock formatted value</p>')

  const componentInstance = {
    name: 'mock component',
    items: [
      {
        name: 'mock anyOf item name one',
        _id: 'mock anyOf item id one',
        value: 'mock anyOf value one'
      },
      {
        name: 'mock anyOf item name two',
        _id: 'mock anyOf item id two',
        value: 'mock anyOf value two'
      }
    ]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  const isMultiLineStub = sinon.stub(anyOfController, 'isMultiLine').returns(true)

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(anyOfController.getAnsweredDisplayValue(componentInstance, userData), '<p class="govuk-body">mock formatted value</p>', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock anyOf value one\n\nmock anyOf value two'], 'gets is multiline')

  const {firstCall: {args: [one]}} = getInstanceTitleSummaryStub
  t.equal(one, 'mock anyOf item id one', 'gets the instance title summary')

  const {secondCall: {args: [two]}} = getInstanceTitleSummaryStub
  t.equal(two, 'mock anyOf item id two', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock anyOf value one\n\nmock anyOf value two', {}, {multiline: true, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is not defined and the anyOf value is not defined and there is more than one answer', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('yes')

  formatStub.returns('<p>mock formatted value</p>')

  const componentInstance = {
    name: 'mock component',
    items: [
      {
        name: 'mock anyOf item name one',
        _id: 'mock anyOf item id one'
      },
      {
        name: 'mock anyOf item name two',
        _id: 'mock anyOf item id two'
      }
    ]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  const isMultiLineStub = sinon.stub(anyOfController, 'isMultiLine').returns(true)

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(anyOfController.getAnsweredDisplayValue(componentInstance, userData), '<p class="govuk-body">mock formatted value</p>', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, '\n\n'], 'gets is multiline')

  const {firstCall: {args: [one]}} = getInstanceTitleSummaryStub
  t.equal(one, 'mock anyOf item id one', 'gets the instance title summary')

  const {secondCall: {args: [two]}} = getInstanceTitleSummaryStub
  t.equal(two, 'mock anyOf item id two', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['\n\n', {}, {multiline: true, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value for item when the instance title summary is defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  formatStub.returns('mock formatted value')

  const componentInstanceItem = {
    name: 'mock anyOf item name', _id: 'mock anyOf item id', value: 'mock anyOf value'
  }

  const userData = {
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(anyOfController.getAnsweredDisplayValueForItem(componentInstanceItem, userData), 'mock formatted value', 'returns the value')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value for item when the instance title summary is not defined and the anyOf value is defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  formatStub.returns('mock formatted value')

  const componentInstanceItem = {
    name: 'mock anyOf item name', _id: 'mock anyOf item id', value: 'mock anyOf value'
  }

  const userData = {
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(anyOfController.getAnsweredDisplayValueForItem(componentInstanceItem, userData), 'mock formatted value', 'returns the value')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock anyOf value', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value for item when the instance title summary is not defined and the anyOf value is not defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  formatStub.returns('mock formatted value')

  const componentInstanceItem = {
    name: 'mock anyOf item name', _id: 'mock anyOf item id'
  }

  const userData = {
    contentLang: 'mock content lang'
  }

  const anyOfController = new AnyOfController()

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(anyOfController.getAnsweredDisplayValueForItem(componentInstanceItem, userData), 'mock formatted value', 'returns the value')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock anyOf item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, [undefined, {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get redacted display value', (t) => {
  const getRedactedDisplayValueStub = sinon.stub(AnyOfController.prototype, 'getRedactedDisplayValue').returns('mock return value')

  const anyOfController = new AnyOfController()

  const componentInstance = {}
  const userData = {}

  t.equal(anyOfController.getRedactedDisplayValue(componentInstance, userData), 'mock return value', 'returns the value from super')

  t.deepEqual(getRedactedDisplayValueStub.firstCall.args, [componentInstance, userData], 'calls super')

  getRedactedDisplayValueStub.restore()

  t.end()
})

test('get redacted display value for item', (t) => {
  const getRedactedDisplayValueStub = sinon.stub(AnyOfController.prototype, 'getRedactedDisplayValue').returns('mock return value')

  const anyOfController = new AnyOfController()

  const componentInstanceItem = {}
  const userData = {}

  t.equal(anyOfController.getRedactedDisplayValueForItem(componentInstanceItem, userData), 'mock return value', 'returns the value from super')

  t.deepEqual(getRedactedDisplayValueStub.firstCall.args, [componentInstanceItem, userData], 'calls super')

  getRedactedDisplayValueStub.restore()

  t.end()
})

test('get display value for item when the component is answered', (t) => {
  const anyOfController = new AnyOfController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredItemStub = sinon.stub(anyOfController, 'isAnsweredItem').returns(true)
  const isRedactedItemStub = sinon.stub(anyOfController, 'isRedactedItem').returns(false)
  const getAnsweredDisplayValueForItemStub = sinon.stub(anyOfController, 'getAnsweredDisplayValueForItem').returns('mock answered item display value')
  const getRedactedDisplayValueForItemStub = sinon.stub(anyOfController, 'getRedactedDisplayValueForItem')
  const getNotAnsweredDisplayValueStub = sinon.stub(anyOfController, 'getNotAnsweredDisplayValue')

  t.equal(anyOfController.getDisplayValueForItem(componentInstance, userData), 'mock answered item display value', 'returns the answered item display value')

  t.ok(isAnsweredItemStub.calledWith(componentInstance, userData), 'calls `isAnsweredItem`')
  t.ok(isRedactedItemStub.calledWith(componentInstance, userData), 'calls `isRedactedItem`')
  t.ok(getAnsweredDisplayValueForItemStub.calledWith(componentInstance, userData), 'calls `getAnsweredDisplayValueForItem`')
  t.ok(getRedactedDisplayValueForItemStub.notCalled, 'does not call `getRedactedDisplayValueForItem`')
  t.ok(getNotAnsweredDisplayValueStub.notCalled, 'does not call `getNotAnsweredDisplayValue`')

  t.end()
})

test('get display value for item when the component is answered and redacted', (t) => {
  const anyOfController = new AnyOfController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredItemStub = sinon.stub(anyOfController, 'isAnsweredItem').returns(true)
  const isRedactedItemStub = sinon.stub(anyOfController, 'isRedactedItem').returns(true)
  const getAnsweredDisplayValueForItemStub = sinon.stub(anyOfController, 'getAnsweredDisplayValueForItem')
  const getRedactedDisplayValueForItemStub = sinon.stub(anyOfController, 'getRedactedDisplayValueForItem').returns('mock redacted item display value')
  const getNotAnsweredDisplayValueStub = sinon.stub(anyOfController, 'getNotAnsweredDisplayValue')

  t.equal(anyOfController.getDisplayValueForItem(componentInstance, userData), 'mock redacted item display value', 'returns the redacted item display value')

  t.ok(isAnsweredItemStub.calledWith(componentInstance, userData), 'calls `isAnsweredItem`')
  t.ok(isRedactedItemStub.calledWith(componentInstance, userData), 'calls `isRedactedItem`')
  t.ok(getAnsweredDisplayValueForItemStub.notCalled, 'does not call `getAnsweredDisplayValueForItem`')
  t.ok(getRedactedDisplayValueForItemStub.calledWith(componentInstance, userData), 'calls `getRedactedDisplayValueForItem`')
  t.ok(getNotAnsweredDisplayValueStub.notCalled, 'does not call `getNotAnsweredDisplayValue`')

  t.end()
})

test('get display value for item when the component is not answered', (t) => {
  const anyOfController = new AnyOfController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredItemStub = sinon.stub(anyOfController, 'isAnsweredItem').returns(false)
  const isRedactedItemStub = sinon.stub(anyOfController, 'isRedactedItem')
  const getAnsweredDisplayValueForItemStub = sinon.stub(anyOfController, 'getAnsweredDisplayValueForItem')
  const getRedactedDisplayValueForItemStub = sinon.stub(anyOfController, 'getRedactedDisplayValueForItem')
  const getNotAnsweredDisplayValueStub = sinon.stub(anyOfController, 'getNotAnsweredDisplayValue').returns('mock not answered item display value')

  t.equal(anyOfController.getDisplayValueForItem(componentInstance, userData), 'mock not answered item display value', 'returns the not answered item display value')

  t.ok(isAnsweredItemStub.calledWith(componentInstance, userData), 'calls `isAnsweredItem`')
  t.ok(isRedactedItemStub.notCalled, 'does not call `isRedactedItem`')
  t.ok(getAnsweredDisplayValueForItemStub.notCalled, 'does not call `getAnsweredDisplayValueForItem`')
  t.ok(getRedactedDisplayValueForItemStub.notCalled, 'does not call `getRedactedDisplayValueForItem`')
  t.ok(getNotAnsweredDisplayValueStub.calledWith(componentInstance, userData), 'calls `getNotAnsweredDisplayValue`')

  t.end()
})
