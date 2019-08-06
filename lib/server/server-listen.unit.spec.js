const test = require('tape')
const {stub} = require('sinon')

const listenServer = require('./server-listen')

const listenStub = stub()
listenStub.callsFake((port, fn) => {
  setTimeout(fn, 1)
  return 'server'
})
const app = {
  listen: listenStub
}

const errorListenStub = stub()
errorListenStub.callsFake((port, fn) => {
  setTimeout(() => {
    fn('error')
  }, 1)
  return 'server'
})
const errorApp = {
  listen: errorListenStub
}

test('When starting the server', async t => {
  listenStub.resetHistory()

  await listenServer(app, {PORT: 1234})

  const listenStubArgs = listenStub.getCall(0).args
  t.equal(listenStubArgs[0], 1234, 'it should start the server using the port specified')

  t.end()
})

test('When resolving the promise returned by the server', async t => {
  listenStub.resetHistory()

  await listenServer(app, {PORT: 3000})
    .then(result => {
      t.deepEqual(result, {
        server: 'server',
        app
      }, 'it should call any next function with an object containing the server object and the app instance')
    })

  t.end()
})

test('When rejecting the promise returned by the server', async t => {
  errorListenStub.resetHistory()

  await listenServer(errorApp, {PORT: 3000})
    .catch(error => {
      t.deepEqual(error, 'error', 'it should call any catch function with the error')
    })

  t.end()
})

test('When starting the server with a callback option', async t => {
  t.plan(2)
  listenStub.resetHistory()

  await listenServer(app, {
    PORT: 3000,
    callback: (err, result) => {
      t.equal(err, undefined, 'it should not pass any value for the error arg')
      t.deepEqual(result, {
        server: 'server',
        app
      }, 'it should call the callback function with an object containing the server object and the app instance')
    }
  })
})

test('When starting the server with a callback option and an error is thrown', async t => {
  t.plan(1)
  errorListenStub.resetHistory()

  await listenServer(errorApp, {
    PORT: 3000,
    callback: (err) => {
      t.deepEqual(err, 'error', 'it should call the callback function with the error')
    }
  })
})
