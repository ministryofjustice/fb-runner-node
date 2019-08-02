const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const configureMonitoringStub = stub()

const appDisableStub = stub()
const appSetStub = stub()
const appUseStub = stub()
const app = {
  disable: appDisableStub,
  set: appSetStub,
  use: appUseStub
}
const express = () => {
  return app
}

const runnerInstance = 'runner'
const initRunnerStub = stub()
initRunnerStub.callsFake(async () => runnerInstance)

const listenServerStub = stub()
listenServerStub.callsFake(async () => {})

const CONSTANTS = {
  APP_DIR: '/appdir/constants'
}

const server = proxyquire('./server', {
  '../constants/constants': CONSTANTS,
  express,
  './server-monitoring': configureMonitoringStub,
  './server-init': initRunnerStub,
  './server-listen': listenServerStub
})

const resetStubs = () => {
  appDisableStub.resetHistory()
  appSetStub.resetHistory()
  appUseStub.resetHistory()
  configureMonitoringStub.resetHistory()
  initRunnerStub.resetHistory()
  listenServerStub.resetHistory()
}

test('When starting the server', async t => {
  resetStubs()

  await server.start()

  t.ok(appDisableStub.calledOnceWithExactly('x-powered-by'), 'it should disable the x-powered-by header')
  t.ok(appSetStub.calledOnceWithExactly('view engine', 'html'), 'it should set the view engine to html')

  t.ok(configureMonitoringStub.calledOnce, 'it should set up monitoring')
  const monitorArgs = configureMonitoringStub.getCall(0).args
  t.deepEqual(monitorArgs[0], app, 'it should pass the app to the monitoring setup method')
  t.deepEqual(monitorArgs[1].APP_DIR, '/appdir/constants', 'it should pass through constants to the monitoring setup method')

  t.ok(initRunnerStub.calledOnce, 'it should create the runner instance')
  const initRunnerArgs = initRunnerStub.getCall(0).args
  t.deepEqual(initRunnerArgs[0], app, 'it should pass the app to the initRunner method')
  t.deepEqual(initRunnerArgs[1].APP_DIR, '/appdir/constants', 'it should pass through constants to the initRunner method')

  t.ok(appUseStub.calledOnce, 'it should mount the runner instance')
  const useArgs = appUseStub.getCall(0).args
  t.deepEqual(useArgs[0], runnerInstance, 'it should pass runner instance to express use method')

  t.ok(listenServerStub.calledOnce, 'it should start the runner server')
  const listenServerArgs = listenServerStub.getCall(0).args
  t.deepEqual(listenServerArgs[0], app, 'it should pass the app to the listenServer method')
  t.deepEqual(listenServerArgs[1].APP_DIR, '/appdir/constants', 'it should pass through constants to the listenServer method')

  t.end()
})

test('When starting the server with custom options', async t => {
  resetStubs()

  await server.start({APP_DIR: '/appdir/options'})

  const monitorArgs = configureMonitoringStub.getCall(0).args
  t.deepEqual(monitorArgs[1].APP_DIR, '/appdir/options', 'it should override default constants values passed to monitoring setup method with those defined in custom options')

  const initRunnerArgs = initRunnerStub.getCall(0).args
  t.deepEqual(initRunnerArgs[1].APP_DIR, '/appdir/options', 'it should override default constants values passed to initRunner method with those defined in custom options')

  const listenServerArgs = listenServerStub.getCall(0).args
  t.deepEqual(listenServerArgs[1].APP_DIR, '/appdir/options', 'it should override default constants values passed to listenServer method with those defined in custom options')

  t.end()
})

test('When exporting the server object', async t => {
  t.equal(server.initRunner, initRunnerStub, 'it should export the initRunner method')
  t.end()
})
