const test = require('tape')
const {spy} = require('sinon')
const proxyquire = require('proxyquire')
const {getMocks} = require('../../spec/mock-express-middleware')

const auth = require('./auth')

const proxyAuth = proxyquire('./auth', {
  'express-basic-auth': () => {
    return (req, res, next) => {
      next('basicAuth invoked')
    }
  }
})

const defaultAuth = () => {
  return auth.init({username: 'foo', password: 'bar'})
}

test('When auth is required ', t => {
  t.equal(typeof auth.init, 'function', 'it should export the init method')

  t.end()
})

test('When auth is initialised with no credentials and no ENV variables', t => {
  const authMiddleware = auth.init()
  t.equals(authMiddleware.name, '', 'it should return the empty middleware')

  t.end()
})

test('When auth is initialised with explicit credentials', t => {
  const authMiddleware = defaultAuth()
  t.equals(authMiddleware.name, 'authorize', 'it should return the authorize middleware')

  t.end()
})

test('When auth is initialised with credentials', t => {
  const authMiddleware = proxyAuth.init({username: 'foo', password: 'bar'})
  const {req, res} = getMocks({
    req: {

      headers: {
        'x-forwarded-host': 'http://origin'
      },
      connection: {
        remoteAddress: ''
      }
    }
  })
  authMiddleware(req, res, (msg) => {
    t.equals(msg, 'basicAuth invoked', 'it should invoke basicAuth')
  })

  const basicAuthSpy = spy(auth, 'callBasicAuth')

  auth.init({username: 'foo', password: 'bar'})
  t.deepEquals(basicAuthSpy.getCall(0).args[0], {users: {foo: 'bar'}, realm: undefined}, 'it should pass the correct users object to basicAuth')

  basicAuthSpy.resetHistory()

  auth.init({username: 'foo', password: 'bar', realm: 'baz'})
  t.deepEquals(basicAuthSpy.getCall(0).args[0], {users: {foo: 'bar'}, realm: 'baz'}, 'it should pass the realm to basicAuth')

  basicAuthSpy.restore()

  t.end()
})

test('When authentication is on but the request is not from an external domain', t => {
  const authMiddleware = defaultAuth()
  const {req, res} = getMocks({
    req: {
      connection: {
        remoteAddress: ''
      }
    }
  })
  authMiddleware(req, res, () => {
    t.ok(true, 'it should not disallow the request')
  })

  t.end()
})

test('When authentication is on but the request is from the local machine', t => {
  const authMiddleware = defaultAuth()
  const {req, res} = getMocks({
    req: {
      connection: {
        remoteAddress: '127.0.0.1'
      }
    }
  })
  authMiddleware(req, res, () => {
    t.ok(true, 'it should not disallow the request')
  })

  t.end()
})

test('When authentication is off', t => {
  const authMiddleware = auth.init()
  const {req, res} = getMocks()
  authMiddleware(req, res, () => {
    t.ok(true, 'it should not disallow the request')
  })

  t.end()
})
