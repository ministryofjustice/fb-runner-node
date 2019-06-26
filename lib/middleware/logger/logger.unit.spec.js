const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')

const bunyan = require('bunyan')
const createLoggerStub = stub(bunyan, 'createLogger')
const uuid = require('uuid')
const shorthash = require('shorthash')

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
  const uuidV4Stub = stub(uuid, 'v4')
  uuidV4Stub.callsFake(() => '123456')
  const shorthashStub = stub(shorthash, 'unique')
  shorthashStub.callsFake(() => 'hariymaclarey')
  const infoStub = stub()
  const childStub = stub()
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
      cookie: '1234'
    }
  }
  const res = {}
  await invokeMiddleware(req, res)

  const infoStubArgs = infoStub.getCall(0).args
  t.deepEqual(infoStubArgs[0], {
    name: 'http_request',
    request_id: '123456',
    user: 'hariymaclarey',
    req
  }, 'it should log the incoming request, adding a request id')
  t.equal(infoStubArgs[1], 'GET /foo', 'it should set the log message to be a description of the request')

  const childStubArgs = childStub.getCall(0).args
  t.deepEqual(childStubArgs[0], {
    request_id: '123456',
    user: 'hariymaclarey',
    req
  }, 'it should create a child logger, adding a request id')

  t.equal(req.logger, 'childLogger', 'it should attach the child logger to the request object')
  t.end()
})

test('When calling the logger serializers', async t => {
  createLoggerStub.resetHistory()
  logger.init({})
  const serializers = createLoggerStub.getCall(0).args[0].serializers

  const req = {
    method: 'METHOD',
    url: '/url',
    headers: {
      'x-args': 'foo',
      cookie: '123456'
    },
    httpVersion: 1.1,
    upgrade: true,
    additional_prop: 'should be discarded',
    another_prop: 'should also be discarded'
  }
  const serializedReq = serializers.req(req)
  t.deepEqual(serializedReq, {
    method: 'METHOD',
    url: '/url',
    headers: {
      'x-args': 'foo',
      cookie: '[REDACTED]'
    },
    http_version: 1.1,
    upgrade: true
  }, 'it should serialize req objects correctly')

  const error = {
    name: 'error.name',
    code: 'error.code',
    message: 'error.message',
    columnNumber: 'error.columnNumber',
    fileName: 'error.fileName',
    lineNumber: 'error.lineNumber',
    stack: 'error.stack',
    statusCode: 'error.statusCode',
    statusMessage: 'error.statusMessage',
    body: 'error.body',
    response: {body: {code: 403, message: 'Forbidden'}, statusCode: 403},
    additional_prop: 'should be discarded',
    another_prop: 'should also be discarded'
  }
  const serializedError = serializers.error(error)
  t.deepEqual(serializedError, {
    name: 'error.name',
    code: 'error.code',
    message: 'error.message',
    column_number: 'error.columnNumber',
    file_name: 'error.fileName',
    line_number: 'error.lineNumber',
    stack: 'error.stack',
    status_code: 'error.statusCode',
    status_message: 'error.statusMessage',
    body: 'error.body',
    response: {body: {code: 403, message: 'Forbidden'}, statusCode: 403}
  }, 'it should serialize error objects correctly')
  t.end()
})
