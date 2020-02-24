require('@ministryofjustice/module-alias/register-module')(module)

const test = require('tape')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

const createLoggerStub = sinon.stub().returns('logger instance')
const v4Stub = sinon.stub().returns('123456')

const serializers = require('~/fb-runner-node/middleware/serializers/serializers')
const serializeRequestStub = sinon.stub(serializers, 'serializeRequest')
serializeRequestStub.returns({ method: 'PUT' })

const logger = proxyquire('./logger', {
  bunyan: {
    createLogger: createLoggerStub
  },
  uuid: {
    v4: v4Stub
  },
  '~/fb-runner-node/middleware/serializers/serializers': serializers
})

test('When requesting the logger client', async t => {
  createLoggerStub.resetHistory()

  const Logger = logger.getLogger()
  t.deepEqual(Logger, undefined, 'it should return undefined before the logger is initialised')

  logger.init({})

  const postLogger = logger.getLogger()
  t.deepEqual(postLogger, 'logger instance', 'it should return a bunyan instance after the logger is initialised')

  t.end()
})

test('When initialising the logger middleware', async t => {
  createLoggerStub.resetHistory()
  logger.init({
    LOG_LEVEL: 'fatal',
    PLATFORM_ENV: 'platypus',
    DEPLOYMENT_ENV: 'dev',
    SERVICE_SLUG: 'service'
  })
  const loggerArgs = createLoggerStub.getCall(0).args[0]
  t.equal(loggerArgs.name, 'fb-runner-logger', 'it should pass the default logger name to the logger')
  t.equal(loggerArgs.application, 'fb-runner', 'it should pass the application name to the logger')
  t.equal(loggerArgs.PLATFORM_ENV, 'platypus', 'it should pass the platorm env to the logger')
  t.equal(loggerArgs.DEPLOYMENT_ENV, 'dev', 'it should pass the deployment env to the logger')
  t.equal(loggerArgs.SERVICE_SLUG, 'service', 'it should pass the service slug to the logger')
  t.equal(loggerArgs.level, 'fatal', 'it should pass the log level to the logger')
  t.equal(typeof loggerArgs.serializers.req, 'function', 'it should pass the req serializer function to the logger')
  t.equal(typeof loggerArgs.serializers.error, 'function', 'it should pass the error serializer function to the logger')
  t.end()
})

test('When initialising the logger middleware without a log level in a platform environment', async t => {
  createLoggerStub.resetHistory()
  logger.init({
    PLATFORM_ENV: 'platypus'
  })
  const loggerArgs = createLoggerStub.getCall(0).args[0]
  t.equal(loggerArgs.level, 'info', 'it should pass info as the log level to the logger')
  t.end()
})

test('When initialising the logger middleware without a log level in a non-platform environment', async t => {
  createLoggerStub.resetHistory()
  logger.init({})
  const loggerArgs = createLoggerStub.getCall(0).args[0]
  t.equal(loggerArgs.level, 'error', 'it should pass error as the log level to the logger')
  t.end()
})

test('When invoking the logger middleware', async t => {
  createLoggerStub.resetHistory()
  const infoStub = sinon.stub()
  const childStub = sinon.stub()
  childStub.callsFake(() => 'childLogger')
  createLoggerStub.callsFake(() => {
    return {
      info: infoStub,
      child: childStub
    }
  })

  const invokeMiddleware = (req, res, next) => {
    return new Promise((resolve, reject) => {
      const next = () => {
        resolve()
      }
      const middleware = logger.init({})
      middleware(req, res, next)
    })
  }

  const req = {
    method: 'GET',
    url: '/foo',
    headers: {
      cookie: 'sessionId=1234; cookie2=bar'
    }
  }
  const res = {}
  await invokeMiddleware(req, res)

  const infoStubArgs = infoStub.getCall(0).args
  t.deepEqual(infoStubArgs[0], { name: 'http_request', requestId: '123456', req: { method: 'GET', url: '/foo', headers: { cookie: 'sessionId=1234; cookie2=bar' }, logger: 'childLogger' } }, 'it should log the incoming request, adding a request id')
  t.equal(infoStubArgs[1], 'GET /foo', 'it should set the log message to be a description of the request')

  const childStubArgs = childStub.getCall(0).args
  t.deepEqual(childStubArgs[0], { requestId: '123456', req: { method: 'GET', url: '/foo', headers: { cookie: 'sessionId=1234; cookie2=bar' }, logger: 'childLogger' } }, 'it should create a child logger, adding a request id')

  t.equal(req.logger, 'childLogger', 'it should attach the child logger to the request object')
  t.end()
})
