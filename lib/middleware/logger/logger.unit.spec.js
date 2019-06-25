const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')

const bunyan = require('bunyan')
const createLoggerStub = stub(bunyan, 'createLogger')
const uuid = require('uuid')

const logger = proxyquire('./logger', {
  bunyan,
  uuid
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
  // t.equal(loggerArgs.xxxx, 'xxxx', 'it should pass the xxxx to the logger')
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
  t.plan(4)
  createLoggerStub.resetHistory()
  const uuidV4Stub = stub(uuid, 'v4')
  uuidV4Stub.callsFake(() => '123456')
  const infoStub = stub()
  const childStub = stub()
  childStub.callsFake(() => 'childLogger')
  createLoggerStub.callsFake(() => {
    return {
      info: infoStub,
      child: childStub
    }
  })

  const req = {
    method: 'GET',
    url: '/foo'
  }
  const res = {}
  const next = () => {
    const infoStubArgs = infoStub.getCall(0).args
    t.deepEqual(infoStubArgs[0], {
      name: 'http_request',
      request_id: '123456',
      req
    }, 'it should log the incoming request, adding a request id')
    t.equal(infoStubArgs[1], 'GET /foo', 'it should set the log message to be a description of the request')

    const childStubArgs = childStub.getCall(0).args
    t.deepEqual(childStubArgs[0], {
      request_id: '123456',
      req
    }, 'it should create a child logger, adding a request id')

    t.equal(req.logger, 'childLogger', 'it should attach the child logger to the request object')
    t.end()
  }

  const middleware = logger.init({})
  middleware(req, res, next)
})
