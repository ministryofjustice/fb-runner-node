require('@ministryofjustice/module-alias/register-module')(module)

const {
  test
} = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const debugStub = sinon.stub()
const logStub = sinon.stub()
const errorStub = sinon.stub()

debugStub.onCall(0).returns(logStub)
debugStub.onCall(1).returns(errorStub)

const { getMocks, invokeError } = require('~/fb-runner-node/spec/mock-express-middleware')

const nunjucksConfiguration = require('~/fb-runner-node/middleware/nunjucks-configuration/nunjucks-configuration')
const serviceData = require('~/fb-runner-node/service-data/service-data')
const page = require('~/fb-runner-node/page/page')

const setServiceStub = sinon.stub(page, 'setService')
setServiceStub.callsFake((instance) => instance)

const errorHandler = proxyquire('./error-handler', {
  debug: debugStub,
  '~/fb-runner-node/middleware/nunjucks-configuration/nunjucks-configuration': nunjucksConfiguration,
  '~/fb-runner-node/service-data/service-data': serviceData,
  '~/fb-runner-node/page/page': page
})

const errorMocks = (hasGlobalMethods = true, errorHandlerOptions = {}) => {
  const mocks = getMocks({
    req: {
      hasGlobalMethods
    }
  })
  const errorHandlerInstance = errorHandler.init(errorHandlerOptions)
  return Object.assign({ errorHandlerInstance }, mocks)
}

test('When errorHandler is required ', t => {
  t.equal(typeof errorHandler.init, 'function', 'it should export the locals method')

  t.end()
})

test('When fallback method is called', t => {
  const { req, res, errorHandlerInstance } = errorMocks()
  const resSendStub = sinon.stub(res, 'send')
  const resSendStatusStub = sinon.stub(res, 'sendStatus')

  const expectedBody = (code) => `We are currently experiencing difficulties (${code})`

  errorHandlerInstance._fallbackError(req, res, 404)
  t.true(resSendStatusStub.calledWith(), 'should not send a response for status codes below 500')

  errorHandlerInstance._fallbackError(req, res, 500)
  t.true(resSendStub.calledWith(expectedBody(500)), 'should send correct repsonse for status code 500')

  resSendStub.resetHistory()
  errorHandlerInstance._fallbackError(req, res, 700)
  t.true(resSendStub.calledWith(expectedBody(700)), 'should send correct repsonse for status codes above 500')

  resSendStub.restore()
  resSendStatusStub.restore()
  t.end()
})

test('When render method is called but no error instance exists', async t => {
  t.plan(1)
  const { req, res, errorHandlerInstance } = errorMocks(false)
  const fallbackErrorSpy = sinon.spy(errorHandlerInstance, '_fallbackError')
  await errorHandlerInstance.render(req, res, 404)

  t.deepEqual(fallbackErrorSpy.calledWith(req, res, 404), true, 'it should invoke the fallbackError method with same arguments')
  fallbackErrorSpy.restore()
  t.end()
})

test('When render method is called and an error instance exists', async t => {
  t.plan(2)
  const { req, res, errorHandlerInstance } = errorMocks()
  req.user = {}
  const errorInstance = {
    _id: 'error.404',
    _type: 'page.error',
    heading: 'This page can’t be found',
    lede: 'Please check you’ve entered the correct web address.'
  }
  const errorOutput = 'Hello world'

  const resSendSpy = sinon.spy(res, 'send')
  const getInstanceStub = sinon.stub(serviceData, 'getInstance')
  getInstanceStub.callsFake(_id => {
    if (_id === 'error.404') {
      return errorInstance
    }
  })
  const nunjucksRenderStub = sinon.stub(nunjucksConfiguration, 'renderPage')
  nunjucksRenderStub.returns(errorOutput)
  const fallbackErrorStub = sinon.stub(errorHandlerInstance, '_fallbackError')

  try {
    await errorHandlerInstance.render(req, res, 404)
    t.true(nunjucksRenderStub.calledWithExactly(
      errorInstance, { errCode: 404, GA_TRACKING_ID: undefined, GTM_TRACKING_ID: undefined }
    ), 'should invoke the nunjucks render method with the correct arguments')
    t.true(resSendSpy.calledWith(errorOutput), 'it should send the correct output')
  } catch (e) {
    t.notOk(true, 'it should not throw an error')
    t.notOk(true, 'it should not throw an error')
  }

  fallbackErrorStub.restore()
  nunjucksRenderStub.restore()
  getInstanceStub.restore()
  resSendSpy.restore()

  t.end()
})

test('When render method is called and an error instance exists', async t => {
  t.plan(6)
  const { req, res, errorHandlerInstance } = errorMocks()
  req.user = {}
  const errorInstance = {
    _id: 'error.500',
    _type: 'page.error',
    heading: 'Server error',
    lede: 'Please check you’ve entered the correct web address.'
  }
  const errorOutput = 'Hello world'

  const resSendSpy = sinon.spy(res, 'send')
  const getInstanceStub = sinon.stub(serviceData, 'getInstance')
  getInstanceStub.callsFake(_id => {
    if (_id === 'error.500') {
      return errorInstance
    }
  })

  const nunjucksRenderStub = sinon.stub(nunjucksConfiguration, 'renderPage')
  nunjucksRenderStub.returns(errorOutput)
  const fallbackErrorStub = sinon.stub(errorHandlerInstance, '_fallbackError')

  try {
    await errorHandlerInstance.render(req, res, 500)

    t.true(nunjucksRenderStub.calledWithExactly(
      errorInstance, { errCode: 500, GA_TRACKING_ID: undefined, GTM_TRACKING_ID: undefined }
    ), 'should invoke the nunjucks render method with the correct arguments')
    t.true(resSendSpy.calledWith(errorOutput), 'it should send the correct output')
  } catch (e) {
    t.notOk(true, 'it should not throw an error')
  }

  nunjucksRenderStub.resetHistory()
  resSendSpy.resetHistory()

  try {
    await errorHandlerInstance.render(req, res, 503)

    t.true(nunjucksRenderStub.calledWithExactly(
      errorInstance, { errCode: 503, GA_TRACKING_ID: undefined, GTM_TRACKING_ID: undefined }
    ), 'should invoke the nunjucks render method with the correct arguments')
    t.true(resSendSpy.calledWith(errorOutput), 'it should send the correct output')
  } catch (e) {
    t.notOk(true, 'it should not throw an error')
  }

  nunjucksRenderStub.resetHistory()
  resSendSpy.resetHistory()

  try {
    await errorHandlerInstance.render(req, res, 404)

    t.true(nunjucksRenderStub.calledWithExactly(
      errorInstance, { errCode: 404, GA_TRACKING_ID: undefined, GTM_TRACKING_ID: undefined }
    ), 'should invoke the nunjucks render method with the correct arguments')
    t.true(resSendSpy.calledWith(errorOutput), 'it should send the correct output')
  } catch (e) {
    t.notOk(true, 'it should not throw an error')
  }

  fallbackErrorStub.restore()
  nunjucksRenderStub.restore()
  getInstanceStub.restore()
  resSendSpy.restore()

  t.end()
})

test('When express throws an error', t => {
  const { assertNextCalled, assertStatusCode } = invokeError(errorHandler.init().handle, t, new Error(404))

  assertNextCalled(false)
  assertStatusCode(404)
  t.end()
})

test('When res render method fails', t => {
  const { assertStatusCode } = invokeError(errorHandler.init().handle, t, new Error('404'))

  assertStatusCode(404)
  t.end()
})

test('When res render method fails', t => {
  const { assertStatusCode } = invokeError(errorHandler.init().handle, t, new Error(503))

  assertStatusCode(503)
  t.end()
})

test('When res render method fails', t => {
  const { assertStatusCode } = invokeError(errorHandler.init().handle, t, new Error('an error occurred'))

  assertStatusCode(500)
  t.end()
})

test('When notFound handler called', t => {
  const { req, res, errorHandlerInstance } = errorMocks()
  const renderSpy = sinon.spy(errorHandlerInstance, 'render')
  errorHandlerInstance.notFound(req, res)

  t.true(renderSpy.calledWith(req, res, 404), 'should render 404')
  t.end()
})

test('When notFound handler called but the url contains mangled output', t => {
  const { req, res, errorHandlerInstance } = errorMocks()
  const renderSpy = sinon.spy(errorHandlerInstance, 'render')
  const redirectStub = sinon.stub(res, 'redirect')

  const testDemangle = (url) => {
    req.url = url
    errorHandlerInstance.notFound(req, res)
    t.true(renderSpy.calledWith(req, res, 404), 'it should render a 404 page')
    t.true(redirectStub.notCalled, 'it should not attempt a redirect')
    redirectStub.resetHistory()
  }
  testDemangle('//////////////////////yahoo.com/')

  renderSpy.restore()
  redirectStub.restore()
  t.end()
})

test('When an unauthorised route is hit', t => {
  const { req, assertStatusCode } = invokeError(errorHandler.init().handle, t, new Error(401))

  assertStatusCode(401)
  t.equals(req.unauthorised, true, 'should set req.unauthorised to true')
  t.end()
})
