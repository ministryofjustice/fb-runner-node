const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const configureMonitoringStub = stub()

const useStub = stub()
const app = {
  use: useStub
}
const express = () => {
  return app
}

const runnerInstance = 'runner'
const initRunnerStub = stub()
initRunnerStub.callsFake(async () => runnerInstance)

const startRunnerStub = stub()

const CONSTANTS = {
  APP_DIR: '/appdir/constants'
}

const server = proxyquire('./server', {
  '../constants/constants': CONSTANTS,
  express,
  './server-monitoring': configureMonitoringStub,
  './server-init': initRunnerStub,
  './server-start': startRunnerStub
})

test('When starting the server', async t => {
  configureMonitoringStub.resetHistory()
  initRunnerStub.resetHistory()
  startRunnerStub.resetHistory()

  await server.start()

  t.ok(configureMonitoringStub.calledOnce, 'it should setup monitoring once')
  const monitorArgs = configureMonitoringStub.getCall(0).args
  t.deepEqual(monitorArgs[0], app, 'it should pass the app to the monitoring setup method')
  t.deepEqual(monitorArgs[1].APP_DIR, '/appdir/constants', 'it should pass through constants to the monitoring setup method')

  t.ok(initRunnerStub.calledOnce, 'it should create the runner instance')
  const initRunnerArgs = initRunnerStub.getCall(0).args
  t.deepEqual(initRunnerArgs[0], app, 'it should pass the app to the initRunner method')
  t.deepEqual(initRunnerArgs[1].APP_DIR, '/appdir/constants', 'it should pass through constants to the initRunner method')

  t.ok(useStub.calledOnce, 'it should mount the runner instance')
  const useArgs = useStub.getCall(0).args
  t.deepEqual(useArgs[0], runnerInstance, 'it should pass runner instance to express use method')

  t.ok(startRunnerStub.calledOnce, 'it should start the runner server')
  const startRunnerArgs = startRunnerStub.getCall(0).args
  t.deepEqual(startRunnerArgs[0], app, 'it should pass the app to the startRunner method')
  t.deepEqual(startRunnerArgs[1].APP_DIR, '/appdir/constants', 'it should pass through constants to the startRunner method')

  t.end()
})

test('When starting the server with custom options', async t => {
  configureMonitoringStub.resetHistory()
  initRunnerStub.resetHistory()
  startRunnerStub.resetHistory()

  await server.start({APP_DIR: '/appdir/options'})

  const monitorArgs = configureMonitoringStub.getCall(0).args
  t.deepEqual(monitorArgs[1].APP_DIR, '/appdir/options', 'it should override default constants values passed to monitoring setup method with those defined in custom options')

  const initRunnerArgs = initRunnerStub.getCall(0).args
  t.deepEqual(initRunnerArgs[1].APP_DIR, '/appdir/options', 'it should override default constants values passed to initRunner method with those defined in custom options')

  const startRunnerArgs = startRunnerStub.getCall(0).args
  t.deepEqual(startRunnerArgs[1].APP_DIR, '/appdir/options', 'it should override default constants values passed to startRunner method with those defined in custom options')

  t.end()
})

test('When exporting the server object', async t => {
  t.equal(server.initRunner, initRunnerStub, 'it should export the initRunner method')
  t.end()
})
