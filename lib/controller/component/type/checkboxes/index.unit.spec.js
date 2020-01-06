const proxyquire = require('proxyquire')

const test = require('tape')
const sinon = require('sinon')

const getInstanceTitleSummaryStub = sinon.stub()
const formatStub = sinon.stub()

const CheckboxesController = proxyquire('.', {
  '~/fb-runner-node/service-data/service-data': {
    getInstanceTitleSummary: getInstanceTitleSummaryStub
  },
  '~/fb-runner-node/format/format': {
    format: formatStub
  }
})

test('is answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns('mock checkbox is answered')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock checkbox item', value: 'mock checkbox is answered'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const checkboxesController = new CheckboxesController()

  t.ok(checkboxesController.isAnswered(componentInstance, userData), 'returns true')

  t.end()
})

test('is not answered', (t) => {
  const getUserDataInputPropertyStub = sinon.stub().returns('mock checkbox is answered')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock checkbox item'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const checkboxesController = new CheckboxesController()

  t.notOk(checkboxesController.isAnswered(componentInstance, userData), 'returns false')

  t.end()
})

test('is redacted', (t) => {
  const isRedactedStub = sinon.stub(CheckboxesController.prototype, 'isRedacted').returns('mock return value')

  const checkboxesController = new CheckboxesController()

  const componentInstance = {}
  const userData = {}

  t.equal(checkboxesController.isRedacted(componentInstance, userData), 'mock return value', 'returns the value from super')

  t.deepEqual(isRedactedStub.firstCall.args, [componentInstance, userData], 'calls super')

  isRedactedStub.restore()

  t.end()
})

test('is answered item when the instance title summary is defined', (t) => {
  getInstanceTitleSummaryStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock checkbox is answered')

  const componentInstance = {
    name: 'mock component', _id: 'mock checkbox item id'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const checkboxesController = new CheckboxesController()

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.ok(checkboxesController.isAnsweredItem(componentInstance, userData), 'returns true')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  t.end()
})

test('is answered item when the instance title summary is not defined and the checkbox value is defined', (t) => {
  getInstanceTitleSummaryStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock checkbox is answered')

  const componentInstance = {
    name: 'mock component', _id: 'mock checkbox item id', value: 'mock checkbox item value'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const checkboxesController = new CheckboxesController()

  getInstanceTitleSummaryStub.returns(undefined)

  t.ok(checkboxesController.isAnsweredItem(componentInstance, userData), 'returns true')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  t.end()
})

test('is answered item when the instance title summary is not defined and the checkbox value is not defined', (t) => {
  getInstanceTitleSummaryStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock checkbox is answered')

  const componentInstance = {
    name: 'mock component', _id: 'mock checkbox item id'
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub
  }

  const checkboxesController = new CheckboxesController()

  getInstanceTitleSummaryStub.returns(undefined)

  t.notOk(checkboxesController.isAnsweredItem(componentInstance, userData), 'returns false')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  t.end()
})

test('is redacted item', (t) => {
  const isRedactedStub = sinon.stub(CheckboxesController.prototype, 'isRedacted').returns('mock return value')

  const checkboxesController = new CheckboxesController()

  const componentInstanceItem = {}
  const userData = {}

  t.equal(checkboxesController.isRedactedItem(componentInstanceItem, userData), 'mock return value', 'returns the value from super')

  t.deepEqual(isRedactedStub.firstCall.args, [componentInstanceItem, userData], 'calls super')

  isRedactedStub.restore()

  t.end()
})

test('get answered display value when the instance title summary is defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock checkbox value')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock checkbox item name', _id: 'mock checkbox item id', value: 'mock checkbox value'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  const isMultiLineStub = sinon.stub(checkboxesController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(checkboxesController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock instance title summary'], 'gets is multiline')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is not defined and the checkbox value is defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('mock checkbox value')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock checkbox item name', _id: 'mock checkbox item id', value: 'mock checkbox value'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  const isMultiLineStub = sinon.stub(checkboxesController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(checkboxesController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock checkbox value'], 'gets is multiline')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock checkbox value', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is not defined and the checkbox value is not defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('yes')

  formatStub.returns('mock formatted value')

  const componentInstance = {
    name: 'mock component', items: [{name: 'mock checkbox item name', _id: 'mock checkbox item id'}]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  const isMultiLineStub = sinon.stub(checkboxesController, 'isMultiLine').returns(false)

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(checkboxesController.getAnsweredDisplayValue(componentInstance, userData), 'mock formatted value', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, ''], 'gets is multiline')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is defined and there is more than one answer', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub()

  getUserDataInputPropertyStub.onCall(0).returns('mock checkbox value one')
  getUserDataInputPropertyStub.onCall(1).returns('mock checkbox value two')

  formatStub.returns('<p>mock formatted value</p>')

  const componentInstance = {
    name: 'mock component',
    items: [
      {
        name: 'mock checkbox item name one',
        _id: 'mock checkbox item id one',
        value: 'mock checkbox value one'
      },
      {
        name: 'mock checkbox item name two',
        _id: 'mock checkbox item id two',
        value: 'mock checkbox value two'
      }
    ]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  const isMultiLineStub = sinon.stub(checkboxesController, 'isMultiLine').returns(true)

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(checkboxesController.getAnsweredDisplayValue(componentInstance, userData), '<p class="govuk-body">mock formatted value</p>', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock instance title summary\n\nmock instance title summary'], 'gets is multiline')

  const {firstCall: {args: [one]}} = getInstanceTitleSummaryStub
  t.equal(one, 'mock checkbox item id one', 'gets the instance title summary')

  const {secondCall: {args: [two]}} = getInstanceTitleSummaryStub
  t.equal(two, 'mock checkbox item id two', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary\n\nmock instance title summary', {}, {multiline: true, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is not defined and the checkbox value is defined and there is more than one answer', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub()

  getUserDataInputPropertyStub.onCall(0).returns('mock checkbox value one')
  getUserDataInputPropertyStub.onCall(1).returns('mock checkbox value two')

  formatStub.returns('<p>mock formatted value</p>')

  const componentInstance = {
    name: 'mock component',
    items: [
      {
        name: 'mock checkbox item name one',
        _id: 'mock checkbox item id one',
        value: 'mock checkbox value one'
      },
      {
        name: 'mock checkbox item name two',
        _id: 'mock checkbox item id two',
        value: 'mock checkbox value two'
      }
    ]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  const isMultiLineStub = sinon.stub(checkboxesController, 'isMultiLine').returns(true)

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(checkboxesController.getAnsweredDisplayValue(componentInstance, userData), '<p class="govuk-body">mock formatted value</p>', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, 'mock checkbox value one\n\nmock checkbox value two'], 'gets is multiline')

  const {firstCall: {args: [one]}} = getInstanceTitleSummaryStub
  t.equal(one, 'mock checkbox item id one', 'gets the instance title summary')

  const {secondCall: {args: [two]}} = getInstanceTitleSummaryStub
  t.equal(two, 'mock checkbox item id two', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock checkbox value one\n\nmock checkbox value two', {}, {multiline: true, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value when the instance title summary is not defined and the checkbox value is not defined and there is more than one answer', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  const getUserDataInputPropertyStub = sinon.stub().returns('yes')

  formatStub.returns('<p>mock formatted value</p>')

  const componentInstance = {
    name: 'mock component',
    items: [
      {
        name: 'mock checkbox item name one',
        _id: 'mock checkbox item id one'
      },
      {
        name: 'mock checkbox item name two',
        _id: 'mock checkbox item id two'
      }
    ]
  }

  const userData = {
    getUserDataInputProperty: getUserDataInputPropertyStub,
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  const isMultiLineStub = sinon.stub(checkboxesController, 'isMultiLine').returns(true)

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(checkboxesController.getAnsweredDisplayValue(componentInstance, userData), '<p class="govuk-body">mock formatted value</p>', 'returns the value')

  t.deepEqual(isMultiLineStub.firstCall.args, [componentInstance, '\n\n'], 'gets is multiline')

  const {firstCall: {args: [one]}} = getInstanceTitleSummaryStub
  t.equal(one, 'mock checkbox item id one', 'gets the instance title summary')

  const {secondCall: {args: [two]}} = getInstanceTitleSummaryStub
  t.equal(two, 'mock checkbox item id two', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['\n\n', {}, {multiline: true, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value for item when the instance title summary is defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  formatStub.returns('mock formatted value')

  const componentInstanceItem = {
    name: 'mock checkbox item name', _id: 'mock checkbox item id', value: 'mock checkbox value'
  }

  const userData = {
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  getInstanceTitleSummaryStub.returns('mock instance title summary')

  t.equal(checkboxesController.getAnsweredDisplayValueForItem(componentInstanceItem, userData), 'mock formatted value', 'returns the value')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock instance title summary', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value for item when the instance title summary is not defined and the checkbox value is defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  formatStub.returns('mock formatted value')

  const componentInstanceItem = {
    name: 'mock checkbox item name', _id: 'mock checkbox item id', value: 'mock checkbox value'
  }

  const userData = {
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(checkboxesController.getAnsweredDisplayValueForItem(componentInstanceItem, userData), 'mock formatted value', 'returns the value')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, ['mock checkbox value', {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get answered display value for item when the instance title summary is not defined and the checkbox value is not defined', (t) => {
  getInstanceTitleSummaryStub.reset()
  formatStub.reset()

  formatStub.returns('mock formatted value')

  const componentInstanceItem = {
    name: 'mock checkbox item name', _id: 'mock checkbox item id'
  }

  const userData = {
    contentLang: 'mock content lang'
  }

  const checkboxesController = new CheckboxesController()

  getInstanceTitleSummaryStub.returns(undefined)

  t.equal(checkboxesController.getAnsweredDisplayValueForItem(componentInstanceItem, userData), 'mock formatted value', 'returns the value')

  const {firstCall: {args: [id]}} = getInstanceTitleSummaryStub
  t.equal(id, 'mock checkbox item id', 'gets the instance title summary')

  const {firstCall: {args}} = formatStub
  t.deepEqual(args, [undefined, {}, {multiline: false, substitution: true, markdown: true, lang: 'mock content lang'}])

  t.end()
})

test('get redacted display value', (t) => {
  const getRedactedDisplayValueStub = sinon.stub(CheckboxesController.prototype, 'getRedactedDisplayValue').returns('mock return value')

  const checkboxesController = new CheckboxesController()

  const componentInstance = {}
  const userData = {}

  t.equal(checkboxesController.getRedactedDisplayValue(componentInstance, userData), 'mock return value', 'returns the value from super')

  t.deepEqual(getRedactedDisplayValueStub.firstCall.args, [componentInstance, userData], 'calls super')

  getRedactedDisplayValueStub.restore()

  t.end()
})

test('get redacted display value for item', (t) => {
  const getRedactedDisplayValueStub = sinon.stub(CheckboxesController.prototype, 'getRedactedDisplayValue').returns('mock return value')

  const checkboxesController = new CheckboxesController()

  const componentInstanceItem = {}
  const userData = {}

  t.equal(checkboxesController.getRedactedDisplayValueForItem(componentInstanceItem, userData), 'mock return value', 'returns the value from super')

  t.deepEqual(getRedactedDisplayValueStub.firstCall.args, [componentInstanceItem, userData], 'calls super')

  getRedactedDisplayValueStub.restore()

  t.end()
})

test('get display value for item when the component is answered', (t) => {
  const checkboxesController = new CheckboxesController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredItemStub = sinon.stub(checkboxesController, 'isAnsweredItem').returns(true)
  const isRedactedItemStub = sinon.stub(checkboxesController, 'isRedactedItem').returns(false)
  const getAnsweredDisplayValueForItemStub = sinon.stub(checkboxesController, 'getAnsweredDisplayValueForItem').returns('mock answered item display value')
  const getRedactedDisplayValueForItemStub = sinon.stub(checkboxesController, 'getRedactedDisplayValueForItem')
  const getNotAnsweredDisplayValueStub = sinon.stub(checkboxesController, 'getNotAnsweredDisplayValue')

  t.equal(checkboxesController.getDisplayValueForItem(componentInstance, userData), 'mock answered item display value', 'returns the answered item display value')

  t.ok(isAnsweredItemStub.calledWith(componentInstance, userData), 'calls `isAnsweredItem`')
  t.ok(isRedactedItemStub.calledWith(componentInstance, userData), 'calls `isRedactedItem`')
  t.ok(getAnsweredDisplayValueForItemStub.calledWith(componentInstance, userData), 'calls `getAnsweredDisplayValueForItem`')
  t.ok(getRedactedDisplayValueForItemStub.notCalled, 'does not call `getRedactedDisplayValueForItem`')
  t.ok(getNotAnsweredDisplayValueStub.notCalled, 'does not call `getNotAnsweredDisplayValue`')

  t.end()
})

test('get display value for item when the component is answered and redacted', (t) => {
  const checkboxesController = new CheckboxesController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredItemStub = sinon.stub(checkboxesController, 'isAnsweredItem').returns(true)
  const isRedactedItemStub = sinon.stub(checkboxesController, 'isRedactedItem').returns(true)
  const getAnsweredDisplayValueForItemStub = sinon.stub(checkboxesController, 'getAnsweredDisplayValueForItem')
  const getRedactedDisplayValueForItemStub = sinon.stub(checkboxesController, 'getRedactedDisplayValueForItem').returns('mock redacted item display value')
  const getNotAnsweredDisplayValueStub = sinon.stub(checkboxesController, 'getNotAnsweredDisplayValue')

  t.equal(checkboxesController.getDisplayValueForItem(componentInstance, userData), 'mock redacted item display value', 'returns the redacted item display value')

  t.ok(isAnsweredItemStub.calledWith(componentInstance, userData), 'calls `isAnsweredItem`')
  t.ok(isRedactedItemStub.calledWith(componentInstance, userData), 'calls `isRedactedItem`')
  t.ok(getAnsweredDisplayValueForItemStub.notCalled, 'does not call `getAnsweredDisplayValueForItem`')
  t.ok(getRedactedDisplayValueForItemStub.calledWith(componentInstance, userData), 'calls `getRedactedDisplayValueForItem`')
  t.ok(getNotAnsweredDisplayValueStub.notCalled, 'does not call `getNotAnsweredDisplayValue`')

  t.end()
})

test('get display value for item when the component is not answered', (t) => {
  const checkboxesController = new CheckboxesController()

  const componentInstance = {}
  const userData = {}

  const isAnsweredItemStub = sinon.stub(checkboxesController, 'isAnsweredItem').returns(false)
  const isRedactedItemStub = sinon.stub(checkboxesController, 'isRedactedItem')
  const getAnsweredDisplayValueForItemStub = sinon.stub(checkboxesController, 'getAnsweredDisplayValueForItem')
  const getRedactedDisplayValueForItemStub = sinon.stub(checkboxesController, 'getRedactedDisplayValueForItem')
  const getNotAnsweredDisplayValueStub = sinon.stub(checkboxesController, 'getNotAnsweredDisplayValue').returns('mock not answered item display value')

  t.equal(checkboxesController.getDisplayValueForItem(componentInstance, userData), 'mock not answered item display value', 'returns the not answered item display value')

  t.ok(isAnsweredItemStub.calledWith(componentInstance, userData), 'calls `isAnsweredItem`')
  t.ok(isRedactedItemStub.notCalled, 'does not call `isRedactedItem`')
  t.ok(getAnsweredDisplayValueForItemStub.notCalled, 'does not call `getAnsweredDisplayValueForItem`')
  t.ok(getRedactedDisplayValueForItemStub.notCalled, 'does not call `getRedactedDisplayValueForItem`')
  t.ok(getNotAnsweredDisplayValueStub.calledWith(componentInstance, userData), 'calls `getNotAnsweredDisplayValue`')

  t.end()
})
