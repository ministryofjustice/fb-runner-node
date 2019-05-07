const test = require('tape')
const {stub} = require('sinon')
const proxyquire = require('proxyquire')
const csrfToken = require('csrf-token')
const csrfTokenCreateStub = stub(csrfToken, 'create')
csrfTokenCreateStub.callsFake(() => 'fakeCsrfToken')

const {init} = proxyquire('./csrf', {
  'csrf-token': csrfToken
})

const callMiddleware = (req, res, token) => {
  req.user = {
    getUserId: () => 'testUserId'
  }
  req.body = req.body || {}
  res.locals = {}
  return new Promise((resolve, reject) => {
    const csrfMiddleware = init(token)
    csrfMiddleware(req, res, (err) => {
      if (err) {
        reject(err)
      }
      resolve()
    })
  })
}

test('When a get request originates from an external domain', t => {
  t.plan(2)

  const req = {
    method: 'GET',
    headers: {
      'x-forwarded-host': 'http://origin'
    }
  }
  const res = {}
  callMiddleware(req, res, 'sekrit')
    .then(() => {
      t.ok(true, 'it should yield to the next middleware')
      t.equal(res.locals._csrf, 'fakeCsrfToken', 'it should set a csrf token ')
    })
    .catch(e => {
      // should not be called
      t.notOk(true, 'it should not throw an error')
    })
})

test('When a post request does not originate from an external domain', t => {
  t.plan(1)

  const req = {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    }
  }
  const res = {}

  callMiddleware(req, res, 'sekrit')
    .then(() => {
      t.ok(true, 'it should yield to the next middleware')
    })
    .catch(e => {
      // should not be called
      t.notOk(true, 'it should not throw an error')
    })
})

test('When a post request originates from an external domain but is of type multipart/form-data', t => {
  t.plan(1)

  const req = {
    method: 'POST',
    headers: {
      'x-forwarded-host': 'http://origin',
      'content-type': 'multipart/form-data; boundary=----WebKitFormBoundarySIuqabhczi9XwjZ5'
    }
  }
  const res = {}
  callMiddleware(req, res, 'sekrit')
    .then(() => {
      t.ok(true, 'it should yield to the next middleware')
    })
    .catch(e => {
      // should not be called
      t.notOk(true, 'it should not throw an error')
    })
})

test('When a post request originates from an external domain and a valid csrf token is presented', t => {
  t.plan(1)

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
  const res = {}
  callMiddleware(req, res, 'sekrit')
    .then(() => {
      t.ok(true, 'it should yield to the next middleware')
    })
    .catch(e => {
      // should not be called
      t.notOk(true, 'it should not throw an error')
    })
})

test('When a post request originates from an external domain and an invalid csrf token is presented', t => {
  t.plan(3)

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
  const res = {}
  callMiddleware(req, res, 'sekrit')
    .then(() => {
      // should not be called
      t.notOk(true, 'it should throw an error')
    })
    .catch(e => {
      t.equal(e.name, 'FBError', 'it should return the right type of error')
      t.equal(e.message, 403, 'it should return the right error message')
      t.equal(e.code, 'ECSRFTOKENINVALID', 'it should return the right error code')
    })
})

test('When a post request originates from an external domain and no csrf token is presented', t => {
  t.plan(3)

  const req = {
    method: 'POST',
    headers: {
      'x-forwarded-host': 'sekrit',
      'content-type': 'application/x-www-form-urlencoded'
    }
  }
  const res = {}
  callMiddleware(req, res, 'sekrit')
    .then(() => {
      // should not be called
      t.notOk(true, 'it should throw an error')
    })
    .catch(e => {
      t.equal(e.name, 'FBError', 'it should return the right type of error')
      t.equal(e.message, 403, 'it should return the right error message')
      t.equal(e.code, 'ECSRFTOKENMISSING', 'it should return the right error code')
    })
})
