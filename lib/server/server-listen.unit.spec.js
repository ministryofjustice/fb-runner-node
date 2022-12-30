const {
  test
} = require('tap')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const listenStub = sinon.stub()
const errorListenStub = sinon.stub()

const debugStub = sinon.stub()
const logStub = sinon.stub()
const errorStub = sinon.stub()

debugStub.onCall(0).returns(logStub)
debugStub.onCall(1).returns(errorStub)

const listenServer = proxyquire('./server-listen', {
  debug: debugStub
})

const app = {
  listen: listenStub
}

const errorApp = {
  listen: errorListenStub
}

listenStub.callsFake((port, fn) => {
  setTimeout(fn, 1)
  return 'server'
})

errorListenStub.callsFake((port, fn) => {
  setTimeout(() => {
    fn('error')
  }, 1)
  return 'server'
})

test('Starting the server', async (t) => {
  listenStub.resetHistory()

  await listenServer(app, { PORT: 1234 })

  const {
    args: [
      arg
    ]
  } = listenStub.firstCall

  t.equal(arg, 1234, 'starts the server on the port specified')

  t.end()
})

test('Resolving the promise', async (t) => {
  listenStub.resetHistory()

  t.same(await listenServer(app, { PORT: 3000 }), {
    server: 'server',
    app
  }, 'resolves with an object containing the server and the app instance')

  t.end()
})

test('Rejecting the promise', async (t) => {
  errorListenStub.resetHistory()

  try {
    await listenServer(errorApp, { PORT: 3000 })
  } catch (error) {
    t.same(error, 'error', 'rejects with an object containing the error')
  }

  t.end()
})

test('Starting the server with a callback function', async (t) => {
  listenStub.resetHistory()

  await listenServer(app, {
    PORT: 3000,
    callback: (e, result) => {
      t.notOk(e, 'does not call the callback with an error')

      t.same(result, {
        server: 'server',
        app
      }, 'calls the callback with an object containing the server and the app instance')
    }
  })

  t.end()
})

test('Starting the server with a callback function and an error is thrown', async (t) => {
  errorListenStub.resetHistory()

  try {
    await listenServer(errorApp, {
      PORT: 3000,
      callback: (e, result) => {
        t.same(e, 'error', 'calls the callback with an error')

        t.ok(result, 'calls the callback with a result')
      }
    })
  } catch (error) {
    t.same(error, 'error', 'rejects with an object containing the error')
  }

  t.end()
})
