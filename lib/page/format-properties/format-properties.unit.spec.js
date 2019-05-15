const test = require('tape')
const {stub} = require('sinon')

const formatProperties = require('./format-properties')

const userData = (input) => {
  return {
    getUserData: () => input,
    getUserParams: () => {},
    getAllData: () => ({})
  }
}

test('When formatProperties is required ', t => {
  t.equal(typeof formatProperties, 'function', 'it should export a function')
  t.end()
})

test('When given no properties to update', t => {
  const emptyPageInstance = {}
  t.deepEqual(formatProperties(emptyPageInstance, userData({})), {}, 'it should do nothing')
  t.end()
})

const schemaStubFn = () => {
  return {
    properties: {
      title: {
        content: true
      },
      heading: {
        content: true
      },
      lede: {
        content: true
      },
      legend: {
        content: true
      },
      label: {
        content: true
      },
      hint: {
        content: true
      },
      body: {
        content: true,
        multiline: true
      },
      html: {
        content: true,
        multiline: true
      }
    }
  }
}

test('When updating a page', t => {
  const getServiceSchemaStub = stub(formatProperties, 'getServiceSchema')
  getServiceSchemaStub.callsFake(schemaStubFn)
  const emptyPageInstance = {}
  t.deepEqual(formatProperties(emptyPageInstance, userData({})), {}, 'it should do nothing')

  const contentProps = [
    'title',
    'heading',
    'lede',
    'legend',
    'label',
    'hint'
  ]
  contentProps.forEach(prop => {
    const pageInstance = {[prop]: '{x}'}
    t.deepEqual(formatProperties(pageInstance, userData({x: 'value'})), {[prop]: 'value'}, `it should update ${prop} properties`)
  })

  const pageInstance = {body: '{x}'}
  t.deepEqual(formatProperties(pageInstance, userData({x: 'value'})), {body: '<p>value</p>'}, 'it should update body properties')

  const pageInstanceWithHtml = {label: {html: '{x}'}}
  t.deepEqual(formatProperties(pageInstanceWithHtml, userData({x: 'value'})), {label: {html: 'value'}}, 'it should update nested html properties')

  getServiceSchemaStub.restore()
  t.end()
})

test('When updating a page', t => {
  const getServiceSchemaStub = stub(formatProperties, 'getServiceSchema')
  getServiceSchemaStub.callsFake(schemaStubFn)

  const emptyPageInstance = {}
  t.deepEqual(formatProperties(emptyPageInstance, userData({})), {}, 'it should do nothing')

  const contentProps = [
    'body',
    'html'
  ]
  contentProps.forEach(prop => {
    const pageInstance = {[prop]: '{x}'}
    t.deepEqual(formatProperties(pageInstance, userData({x: 'value'})), {[prop]: '<p>value</p>'}, `it should update ${prop} properties`)
  })

  const pageInstance = {body: '{x}'}
  t.deepEqual(formatProperties(pageInstance, userData({x: 'value'})), {body: '<p>value</p>'}, 'it should update body properties')

  const pageInstanceWithHtml = {label: {html: '{x}'}}
  t.deepEqual(formatProperties(pageInstanceWithHtml, userData({x: 'value'})), {label: {html: 'value'}}, 'it should update nested html properties')

  getServiceSchemaStub.restore()
  t.end()
})
