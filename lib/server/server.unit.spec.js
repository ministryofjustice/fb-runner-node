const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const configureMonitoringStub = stub()
const configureSourcesStub = stub()
const loadSourcesStub = stub()
const configureMiddlewareStub = stub()
const startRunnerStub = stub()

const CONSTANTSStub = stub()
CONSTANTSStub.returns({
  foo: 'bar'
})

const server = proxyquire('./server', {
  './server-monitoring': configureMonitoringStub,
  './sources/sources-configure': configureSourcesStub,
  './sources/sources-load': loadSourcesStub,
  './server-middleware': configureMiddlewareStub,
  './server-start': startRunnerStub,
  '../constants/constants': CONSTANTSStub
})

test('When dadasdadas', t => {
  t.end()
})
