const test = require('tape')
const {stub} = require('sinon')
const useAsync = require('./use-async')


test('When asynced middleware executes successfully and headers have not been sent', async t => {
  const wrappedRoute = useAsync((req, res) => {
    return Promise.resolve()
  })

  t.plan(1)

  const nextStub = stub()

  await wrappedRoute({}, {}, nextStub)

  process.nextTick(() => {
    t.equal(nextStub.calledOnce, true, 'it should invoke the next middleware' )
    t.end()
  })


})

test('When asynced middleware executes successfully and headers have not been sent', async t => {
  const wrappedRoute = useAsync((req, res) => {
    return Promise.resolve()
  })

  t.plan(1)

  const nextStub = stub()

  const res = {}

  await wrappedRoute({}, res, nextStub)

  res.headersSent = true

  process.nextTick(() => {
    t.equal(nextStub.called, false, 'it should not invoke the next middleware')
    t.end()
  })
})

test('When asynced middleware throws an error and headers have not been sent', async t => {
  const error = new Error('bunnies')

  const wrappedRoute = useAsync((req, res) => {
    return Promise.reject(error)
  })

  t.plan(1)

  const nextStub = stub()

  await wrappedRoute({}, {}, nextStub)

  process.nextTick(() => {
    // double nextTick is intentional here as a work around the catch clause
    process.nextTick(() => {
      t.equal(nextStub.withArgs(error).calledOnce, true, 'it should invoke the next middleware with error' )
      t.end()
    })
  })

})

test('When asynced middleware executes successfully and headers have not been sent', async t => {
  const error = new Error('bunnies')

  const wrappedRoute = useAsync((req, res) => {
    return Promise.reject(error)
  })

  t.plan(1)
  const res = {}


  const nextStub = stub()

  await wrappedRoute({}, res, nextStub)

  res.headersSent = true

  process.nextTick(() => {
    process.nextTick(() => {
      t.equal(nextStub.called, false, 'it should not invoke the next middleware' )
      t.end()
    })
  })
})
