const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')

const useStub = stub()
const routerInstance = {
  use: useStub
}
const RouterStub = stub()
RouterStub.returns(routerInstance)

const express = {
  Router: RouterStub
}

const configureMiddlewareStub = stub()
configureMiddlewareStub.returns([
  'middleware_a',
  ['/route-b', 'middleware_b']
])

const getRouter = proxyquire('./server-router', {
  express,
  './server-middleware': configureMiddlewareStub
})

const options = {
  foo: 'bar'
}

test('When getting the server router', t => {
  const router = getRouter(options)

  t.ok(configureMiddlewareStub.calledOnce, 'it should initialise the runner middleware once')
  t.deepEqual(configureMiddlewareStub.getCall(0).args, [options], 'it should call configureMiddleware with the expected args')

  const useCalls = useStub.getCalls()
  t.equal(useCalls.length, 2, 'it should use the expected number of middleware functions')
  t.deepEqual(useCalls[0].args, ['middleware_a'], 'it should call use with the expected args if passed a function')
  t.deepEqual(useCalls[1].args, ['/route-b', 'middleware_b'], 'it should call use with the expected args if passed a route and a function')

  t.equal(router, routerInstance, 'it should return the expected router instance')

  t.end()
})
