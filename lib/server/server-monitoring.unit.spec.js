const test = require('tape')
const {spy, stub} = require('sinon')
const proxyquire = require('proxyquire')

const Sentry = require('@sentry/node')
const sentryInitSpy = spy(Sentry, 'init')
const sentryConfigureScopeStub = stub(Sentry, 'configureScope')
const metrics = require('../middleware/metrics/metrics')
const metricsInitStub = stub(metrics, 'init')
const logger = require('../middleware/logger/logger')
const loggerInitStub = stub(logger, 'init')
const serializers = require('../middleware/serializers/serializers')
const serializeRequestStub = stub(serializers, 'serializeRequest')
serializeRequestStub.returns('XXXX')

const app = {
  use: () => {},
  locals: {}
}

const dsn = 'https://f9f9f9f9f9f9f9f9f9f9f9f9f9f9f9f9:c4c4c4c4c4c4c4c4c4c4c4c4c4c4c4c4@sentry.service.dsd.io/256'

const args = {
  SENTRY_DSN: dsn,
  LOG_LEVEL: 'feverish',
  PLATFORM_ENV: 'platformEnv',
  DEPLOYMENT_ENV: 'deploymentEnv',
  SERVICE_SLUG: 'serviceSlug',
  APP_VERSION: 'release'
}

const resetStubs = () => {
  sentryInitSpy.resetHistory()
  sentryConfigureScopeStub.resetHistory()
  metricsInitStub.resetHistory()
  loggerInitStub.resetHistory()
}

const configureMonitoring = proxyquire('./server-monitoring', {
  '@sentry/node': Sentry,
  '../middleware/metrics/metrics': metrics,
  '../middleware/logger/logger': logger,
  '../middleware/serializers/serializers': serializers
})

test('When configuring the server monitoring and no sentry DSN is passed (exceptions)', t => {
  resetStubs()

  configureMonitoring(app)

  t.ok(sentryInitSpy.notCalled, 'it should not initialise Sentry')

  t.end()
})

test('When configuring the server monitoring and a sentry DSN is passed (exceptions)', t => {
  resetStubs()

  configureMonitoring(app, args)

  const sentryInitArgs = sentryInitSpy.getCall(0).args[0]
  t.ok(sentryInitSpy.called, 'it should initialise Sentry')
  t.equal(sentryInitArgs.dsn, dsn, 'it should use the correct dsn value')
  t.equal(sentryInitArgs.environment, 'platformEnv / deploymentEnv', 'it should use the correct environment value')
  t.equal(sentryInitArgs.release, 'release', 'it should use the correct release value')

  const beforeSend = sentryInitArgs.beforeSend
  const eventWithoutRequest = beforeSend({})
  const eventWithRequest = beforeSend({request: {}})

  t.equal(typeof beforeSend, 'function', 'it should pass a beforeSend method to sanitise request data')
  t.deepEqual(eventWithoutRequest, {}, 'it should leave events without request objects alone')
  t.deepEqual(eventWithRequest, {request: 'XXXX'}, 'it should sanitise request objects')

  const sentryConfigureScopeFn = sentryConfigureScopeStub.getCall(0).args[0]
  const scope = {
    setExtra: () => {}
  }
  const scopeSetExtraStub = stub(scope, 'setExtra')
  sentryConfigureScopeFn(scope)

  t.deepEqual(scopeSetExtraStub.getCall(0).args, ['PLATFORM_ENV', 'platformEnv'], 'it should set the PLATFORM_ENV scope')
  t.deepEqual(scopeSetExtraStub.getCall(1).args, ['DEPLOYMENT_ENV', 'deploymentEnv'], 'it should set the DEPLOYMENT_ENV scope')
  t.deepEqual(scopeSetExtraStub.getCall(2).args, ['SERVICE_SLUG', 'serviceSlug'], 'it should set the SERVICE_SLUG scope')

  t.end()
})

test('When configuring the server monitoring (metrics)', t => {
  resetStubs()

  configureMonitoring(app, args)

  const metricsInitStubArgs = metricsInitStub.getCall(0).args

  t.ok(metricsInitStub.called, 'it should initialise the metrics client')
  t.equal(metricsInitStubArgs[0], app, 'it should pass the app to the metrics init method')
  t.deepEqual(metricsInitStubArgs[1], {
    defaultLabels: {
      PLATFORM_ENV: 'platformEnv',
      DEPLOYMENT_ENV: 'deploymentEnv',
      SERVICE_SLUG: 'serviceSlug'
    }
  }, 'it should pass the correct options to the metrics init method')

  t.end()
})

test('When configuring the server monitoring (logger)', t => {
  resetStubs()

  configureMonitoring(app, args)

  const loggerInitStubArgs = loggerInitStub.getCall(0).args

  t.ok(loggerInitStub.called, 'it should initialise the logger client')
  t.deepEqual(loggerInitStubArgs[0], {
    LOG_LEVEL: 'feverish',
    PLATFORM_ENV: 'platformEnv',
    DEPLOYMENT_ENV: 'deploymentEnv',
    SERVICE_SLUG: 'serviceSlug'
  }, 'it should pass the correct options to the logger init method')

  t.end()
})
