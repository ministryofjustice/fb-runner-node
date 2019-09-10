const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')
const route = require('../../route/route')
const getUrlStub = stub(route, 'getUrl')
getUrlStub.callsFake(() => 'url')

const formatProperties = proxyquire('./format-properties', {
  '../../route/route': route
})

const getScopeStub = stub()
getScopeStub.returns('scope')
const getScopedUserDataStub = stub()
const userData = (input) => {
  getScopeStub.resetHistory()
  getScopedUserDataStub.resetHistory()
  getScopedUserDataStub.callsFake((scopedArgs = {}) => {
    const param = Object.assign({
      x: 'param_value'
    }, scopedArgs.param)
    return Object.assign({}, input, {
      _scopes: {
        input,
        param
      }
    })
  })
  return {
    getScopedUserData: getScopedUserDataStub,
    getScope: getScopeStub
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

const schemaStubFn = (_id) => {
  if (_id === 'defaultTypeSchema') {
    return {
      properties: {
        defaultTest: {
          default: 'defaultTest default value'
        }
      }
    }
  }
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
      },
      href: {
        url: true
      },
      unprocessed: {
        content: true
      }
    },
    surplusProperties: [
      'unprocessed'
    ]
  }
}

test('When updating a page', t => {
  const getServiceSchemaStub = stub(formatProperties, 'getServiceSchema')
  getServiceSchemaStub.callsFake(schemaStubFn)

  const userDataStubs = userData({})
  const emptyPageInstanceProps = formatProperties({}, userDataStubs)
  t.deepEqual(emptyPageInstanceProps, {}, 'it should do nothing')
  t.ok(getScopedUserDataStub.calledOnce, 'it should get the scoped user data')
  t.deepEqual(getScopedUserDataStub.getCall(0).args, [{
    param: {},
    page: {},
    instance: {}
  }, 'scope'], 'it should call getScopedUserDataStub with the expected args')

  const noContentProps = formatProperties({nocontent: '{x}'}, userData({x: 'value'}))
  t.deepEqual(noContentProps, {nocontent: '{x}'}, 'it should leave non-content properties intact')

  const unprocessedProps = formatProperties({unprocessed: '{x}'}, userData({x: 'value'}))
  t.deepEqual(unprocessedProps, {unprocessed: '{x}'}, 'it should leave properties marked as surplus intact')

  const componentsProps = formatProperties({
    components: [{
      _type: 'foo',
      heading: '{x}'
    }, {
      _type: 'bar',
      body: '{x}'
    }]
  }, userData({x: 'value'}))
  t.deepEqual(componentsProps, {
    components: [{
      _type: 'foo',
      heading: 'value'
    }, {
      _type: 'bar',
      body: '<p>value</p>'
    }]
  }, 'it should update properties in nested components')

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
    const instanceProps = formatProperties(pageInstance, userData({x: 'value'}))
    t.deepEqual(instanceProps, {[prop]: 'value'}, `it should update ${prop} properties`)
    const pageInstanceWithParamProps = formatProperties({[prop]: '[#x]'}, userData())
    t.deepEqual(pageInstanceWithParamProps, {[prop]: 'param_value'}, `it should update ${prop} properties containing param syntax`)
  })

  const pageInstanceBodyProps = formatProperties({body: '{x}'}, userData({x: 'value'}))
  t.deepEqual(pageInstanceBodyProps, {body: '<p>value</p>'}, 'it should update body properties')

  const pageInstanceWithHtmlProps = formatProperties({label: {html: '{x}'}}, userData({x: 'value'}))
  t.deepEqual(pageInstanceWithHtmlProps, {label: {html: 'value'}}, 'it should update nested html properties')

  const pageInstanceWithHtmlAndParamProps = formatProperties({label: {html: '[#x]'}}, userData())
  t.deepEqual(pageInstanceWithHtmlAndParamProps, {label: {html: 'param_value'}}, 'it should update nested html properties containing param')

  const pageInstanceWithParamProps = formatProperties({heading: '[#z]'}, userData(), {z: 'passed_param_value'})
  t.deepEqual(pageInstanceWithParamProps, {heading: 'passed_param_value'}, 'it should update properties containing param syntax when params are passed explicitly')

  getUrlStub.resetHistory()
  formatProperties({href: '/foo'}, userData())
  t.ok(getUrlStub.notCalled, 'it should not attempt to process absolute urls')

  getUrlStub.resetHistory()
  formatProperties({href: 'http://foo'}, userData())
  t.ok(getUrlStub.notCalled, 'it should not attempt to process fully qualified urls using http protocol')

  getUrlStub.resetHistory()
  formatProperties({href: 'https://foo'}, userData())
  t.ok(getUrlStub.notCalled, 'it should not attempt to process fully qualified urls using https protocol')

  getUrlStub.resetHistory()
  formatProperties({href: '//foo'}, userData())
  t.ok(getUrlStub.notCalled, 'it should not attempt to process fully qualified urls that are protocol relative')

  getUrlStub.resetHistory()
  formatProperties({href: 'foo/bar'}, userData())
  t.ok(getUrlStub.notCalled, 'it should not attempt to process relative urls that contain slashes')

  getUrlStub.resetHistory()
  formatProperties({href: 'foo'}, userData())
  t.deepEqual(getUrlStub.getCall(0).args, ['foo', {}, undefined], 'it should attempt to look up urls that could be ids')

  getServiceSchemaStub.restore()
  getUrlStub.restore()
  t.end()
})

test('When updating a page with multiline properties', t => {
  const getServiceSchemaStub = stub(formatProperties, 'getServiceSchema')
  getServiceSchemaStub.callsFake(schemaStubFn)

  const emptyPageInstanceProps = formatProperties({}, userData({}))
  t.deepEqual(emptyPageInstanceProps, {}, 'it should do nothing')

  const contentProps = [
    'body',
    'html'
  ]
  contentProps.forEach(prop => {
    const pageInstanceProps = formatProperties({[prop]: '{x}'}, userData({x: 'value'}))
    t.deepEqual(pageInstanceProps, {[prop]: '<p>value</p>'}, `it should update ${prop} properties`)
  })

  const pageInstanceBodyProps = formatProperties({body: '{x}'}, userData({x: 'value'}))
  t.deepEqual(pageInstanceBodyProps, {body: '<p>value</p>'}, 'it should update body properties')

  const pageInstanceWithHtmlProps = formatProperties({label: {html: '{x}'}}, userData({x: 'value'}))
  t.deepEqual(pageInstanceWithHtmlProps, {label: {html: 'value'}}, 'it should update nested html properties')

  getServiceSchemaStub.restore()
  t.end()
})

test('When updating a page and a lang is specified', t => {
  const getServiceSchemaStub = stub(formatProperties, 'getServiceSchema')
  getServiceSchemaStub.callsFake(schemaStubFn)

  const pageInstance = {
    title: 'default lang bar',
    'title:foo': 'foo lang bar',
    heading: 'default lang heading'
  }
  const pageInstanceProps = formatProperties(pageInstance, userData(), {})
  t.deepEqual(pageInstanceProps, pageInstance, 'it should leave properties untouched if no lang specified')

  const langInstance = formatProperties(pageInstance, userData(), {}, 'foo')
  t.equal(langInstance.title, pageInstance['title:foo'], 'it should update property with lang value if it exists')
  t.equal(langInstance.heading, pageInstance.heading, 'it should not update property if no lang value exists')

  getServiceSchemaStub.restore()
  t.end()
})

// TODO: move to editor
test('When updating a page in edit mode', t => {
  const getServiceSchemaStub = stub(formatProperties, 'getServiceSchema')
  getServiceSchemaStub.callsFake(() => {
    return {
      properties: {
        heading: {
          title: 'Heading',
          content: true
        },
        body: {
          title: 'Body',
          content: true,
          multiline: true
        }
      },
      required: [
        'heading'
      ]
    }
  })

  const emptyPageInstance = {}

  const data = userData()
  const emptyPageInstanceProps = formatProperties(emptyPageInstance, data, {})
  t.deepEqual(emptyPageInstanceProps, emptyPageInstance, 'it should leave properties untouched if no edit mode passed')

  data.EDITMODE = 'edit'
  const editmodePageInstance = formatProperties(emptyPageInstance, data, {})
  t.equal(editmodePageInstance.heading, '<em><strong>Required - Heading</strong></em>', 'it should set the value of a missing required property to indicate it is required if the mode is edit')
  t.equal(editmodePageInstance.body, '<p><em>Optional - Body</em></p>', 'it should set the value of a missing optional property to indicate it is optional if the mode is edit')

  const editmodePageInstanceWithValues = formatProperties({
    heading: 'heading',
    body: 'body'
  }, data, {})
  t.equal(editmodePageInstanceWithValues.heading, 'heading', 'it should not override the value of a required property if the mode is edit')
  t.equal(editmodePageInstanceWithValues.body, '<p>body</p>', 'it should not override the value of an optional property if the mode is edit')

  data.EDITMODE = 'preview'
  const previewmodePageInstance = formatProperties(emptyPageInstance, data, {})
  t.equal(previewmodePageInstance.heading, undefined, 'it should not set the value of a missing required property if mode is not edit')
  t.equal(previewmodePageInstance.body, undefined, 'it should not set the value of a missing optional property if mode is not edit')

  getServiceSchemaStub.restore()
  t.end()
})
