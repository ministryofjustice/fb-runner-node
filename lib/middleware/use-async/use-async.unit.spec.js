const test = require('tape')
const {stub} = require('sinon')
const useAsync = require('./use-async')

const invokeMiddleware = async (options = {}) => {
  const wrappedRoute = useAsync((req, res) => {
    return options.error ? Promise.reject(options.error) : Promise.resolve()
  })
  const req = {}
  const res = {}
  const nextStub = stub()
  await wrappedRoute(req, res, nextStub)
  if (options.headersSent) {
    res.headersSent = true
  }
  return nextStub
}

test('When async wrapped middleware executes successfully and headers have not been sent', async t => {
  t.plan(1)

  const nextStub = await invokeMiddleware()

  process.nextTick(() => {
    t.equal(nextStub.calledOnce, true, 'it should invoke the next middleware')
  })
})

test('When async wrapped middleware executes successfully and headers have been sent', async t => {
  t.plan(1)

  const nextStub = await invokeMiddleware({headersSent: true})

  process.nextTick(() => {
    t.equal(nextStub.called, false, 'it should not invoke the next middleware')
  })
})

test('When async wrapped middleware throws an error and headers have not been sent', async t => {
  t.plan(1)

  const error = new Error('bunnies')

  const nextStub = await invokeMiddleware({error})

  process.nextTick(() => {
    // double nextTick is intentional here as a work around the catch clause
    process.nextTick(() => {
      t.equal(nextStub.withArgs(error).calledOnce, true, 'it should invoke the next middleware with error')
    })
  })
})

test('When async wrapped middleware throws an error and headers have been sent', async t => {
  t.plan(1)
  const error = new Error('bunnies')

  const nextStub = await invokeMiddleware({error, headersSent: true})

  process.nextTick(() => {
    // double nextTick as above
    process.nextTick(() => {
      t.equal(nextStub.called, false, 'it should not invoke the next middleware')
    })
  })
})
