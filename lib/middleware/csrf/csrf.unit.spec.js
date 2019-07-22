const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')
const useAsync = require('../../middleware/use-async/use-async')
const csrfToken = require('csrf-token')
const csrfTokenCreateStub = stub(csrfToken, 'create')
csrfTokenCreateStub.callsFake(() => 'fakeCsrfToken')

const {init} = proxyquire('./csrf', {
  'csrf-token': csrfToken
})
const csrfMiddleware = useAsync(init('sekrit'))

const {getMocks} = require('../../spec/mock-express-middleware')

const callMiddleware = (REQ, res = {}, token = 'sekrit') => {
  REQ.user = {
    getUserId: () => 'testUserId'
  }
  REQ.body = REQ.body || {}
  res.locals = {}

  const {req} = getMocks({req: REQ})

  return new Promise((resolve, reject) => {
    csrfMiddleware(req, res, (err) => {
      if (err) {
        reject(err)
      }
      resolve(true)
    })
  })
}

test('When a get request originates from an external domain', async t => {
  const req = {
    method: 'GET',
    headers: {
      'x-forwarded-host': 'http://origin'
    }
  }
  const res = {}

  const next = await callMiddleware(req, res)
  t.equal(next, true, 'it should yield to the next middleware')
  t.equal(res.locals._csrf, 'fakeCsrfToken', 'it should set a csrf token ')
  t.end()
})

test('When a post request does not originate from an external domain', async t => {
  const req = {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    }
  }
  const next = await callMiddleware(req)
  t.equal(next, true, 'it should yield to the next middleware')
  t.end()
})

test('When a post request originates from an external domain but is of type multipart/form-data', async t => {
  const req = {
    method: 'POST',
    headers: {
      'x-forwarded-host': 'http://origin',
      'content-type': 'multipart/form-data; boundary=----WebKitFormBoundarySIuqabhczi9XwjZ5'
    }
  }
  const next = await callMiddleware(req)
  t.equal(next, true, 'it should yield to the next middleware')
  t.end()
})

test('When a post request originates from an external domain and a valid csrf token is presented', async t => {
  const req = {
    method: 'POST',
    headers: {
      'x-forwarded-host': 'http://origin',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: {
      _csrf: 'Dk8fUPRk-pMCBvSW_xxcLZQQbv5qGSXk0ZO0'
    }
  }
  const next = await callMiddleware(req)
  t.equal(next, true, 'it should yield to the next middleware')
  t.end()
})

test('When a post request originates from an external domain and an invalid csrf token is presented', async t => {
  const req = {
    method: 'POST',
    headers: {
      'x-forwarded-host': 'http://origin',
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: {
      _csrf: 'invalidCsrf'
    }
  }
  try {
    t.throws(await callMiddleware(req))
  } catch (e) {
    t.equal(e.name, 'FBError', 'it should return the right type of error')
    t.equal(e.message, 403, 'it should return the right error message')
    t.equal(e.code, 'ECSRFTOKENINVALID', 'it should return the right error code')
  }
  t.end()
})

test('When a post request originates from an external domain and no csrf token is presented', async t => {
  const req = {
    method: 'POST',
    headers: {
      'x-forwarded-host': 'sekrit',
      'content-type': 'application/x-www-form-urlencoded'
    }
  }
  try {
    t.throws(await callMiddleware(req))
  } catch (e) {
    t.equal(e.name, 'FBError', 'it should return the right type of error')
    t.equal(e.message, 403, 'it should return the right error message')
    t.equal(e.code, 'ECSRFTOKENMISSING', 'it should return the right error code')
  }
  t.end()
})
