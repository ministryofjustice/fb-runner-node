const test = require('tape')
const proxyquire = require('proxyquire')
const {stub} = require('sinon')

const bunyan = require('bunyan')
const createLoggerStub = stub(bunyan, 'createLogger').returns('logger instance')
const uuid = require('uuid')
const shorthash = require('shorthash')

const logger = proxyquire('./logger', {
  bunyan,
  uuid
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
  const uuidV4Stub = stub(uuid, 'v4')
  uuidV4Stub.callsFake(() => '123456')
  const shorthashStub = stub(shorthash, 'unique')
  shorthashStub.callsFake(() => 'hairymaclarey')
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
      cookie: 'sessionId=1234; cookie2=bar'
    }
  }
  const res = {}
  await invokeMiddleware(req, res)

  const infoStubArgs = infoStub.getCall(0).args
  t.deepEqual(infoStubArgs[0], {
    name: 'http_request',
    requestId: '123456',
    sessionId: 'hairymaclarey',
    cookie2: 'hairymaclarey',
    req
  }, 'it should log the incoming request, adding a request id')
  t.equal(infoStubArgs[1], 'GET /foo', 'it should set the log message to be a description of the request')

  const childStubArgs = childStub.getCall(0).args
  t.deepEqual(childStubArgs[0], {
    requestId: '123456',
    sessionId: 'hairymaclarey',
    cookie2: 'hairymaclarey',
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
    httpVersion: 1.1,
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
    client_headers: 'error.client_headers',
    body: 'error.body',
    response: {
      body: {
        code: 403,
        message: 'Forbidden'
      },
      statusCode: 403,
      statusMessage: 'error.response.statusMessage',
      headers: 'error.response.headers',
      timings: 'error.response.timings'
    },
    additional_prop: 'should be discarded',
    another_prop: 'should also be discarded'
  }
  const serializedError = serializers.error(error)
  t.deepEqual(serializedError, {
    name: 'error.name',
    code: 'error.code',
    message: 'error.message',
    columnNumber: 'error.columnNumber',
    fileName: 'error.fileName',
    lineNumber: 'error.lineNumber',
    stack: 'error.stack',
    statusCode: 'error.statusCode',
    statusMessage: 'error.statusMessage',
    client_headers: 'error.client_headers',
    body: 'error.body',
    response: {
      body: {
        code: 403,
        message: 'Forbidden'
      },
      statusCode: 403,
      statusMessage: 'error.response.statusMessage',
      headers: 'error.response.headers',
      timings: 'error.response.timings'
    }
  }, 'it should serialize error objects correctly')

  const serializedErrorOmitting = serializers.error({
    response: {
      statusCode: 500
    }
  })
  t.deepEqual(serializedErrorOmitting, {
    response: {
      statusCode: 500
    }
  }, 'it should omit undefined properties when serializing objects')
  t.end()
})
