const test = require('tape')

const {init} = require('./referrer')

const callMiddleware = (req, fqd) => {
  return new Promise((resolve, reject) => {
    const referrerMiddleware = init(fqd)
    referrerMiddleware(req, null, () => {
      resolve()
    })
  })
}

test('When the fully qualified domain is set and a post is made without a referrer', t => {
  t.plan(3)

  callMiddleware({
    method: 'POST',
    headers: {
      'x-forwarded-host': 'http://origin'
    }
  }, 'http://origin')
    .then(() => {
      // should not be called
      t.notOk(true, 'it should throw an error')
      t.notOk(true, 'it should throw an error')
      t.notOk(true, 'it should throw an error')
    })
    .catch(e => {
      t.equal(e.name, 'FBError', 'it should return the right type of error')
      t.equal(e.message, 403, 'it should return the right error message')
      t.equal(e.code, 'ENOREFERRER', 'it should return the right error code')
    })
})

test('When the fully qualified domain is set and a post is made from an external domain', t => {
  t.plan(3)

  callMiddleware({
    method: 'POST',
    headers: {
      'x-forwarded-host': 'http://origin',
      referer: 'http://elsewhere'
    }
  }, 'http://origin')
    .then(() => {
      // should not be called
      t.notOk(true, 'it should throw an error')
      t.notOk(true, 'it should throw an error')
      t.notOk(true, 'it should throw an error')
    })
    .catch(e => {
      t.equal(e.name, 'FBError', 'it should return the right type of error')
      t.equal(e.message, 403, 'it should return the right error message')
      t.equal(e.code, 'EINVALIDREFERRER', 'it should return the right error code')
    })
})

test('When the fully qualified domain is set and a post is made from that domain', t => {
  t.plan(1)

  callMiddleware({
    method: 'POST',
    headers: {
      'x-forwarded-host': 'http://origin',
      referer: 'http://origin'
    }
  }, 'http://origin')
    .then(() => {
      t.ok(true, 'it should yield to the next middleware')
    })
    .catch(e => {
      // should not be called
      t.notOk(true, 'it should not throw an error')
    })
})

test('When the fully qualified domain is not set and a post is made from an external domain', t => {
  t.plan(1)

  callMiddleware({
    method: 'POST',
    headers: {
      'x-forwarded-host': 'http://origin',
      referer: 'http://elsewhere'
    }
  })
    .then(() => {
      t.ok(true, 'it should yield to the next middleware')
    })
    .catch(e => {
      // should not be called
      t.notOk(true, 'it should not throw an error')
    })
})

test('When the fully qualified domain is set and a post is made from an internal domain', t => {
  t.plan(1)

  callMiddleware({
    method: 'POST',
    headers: {
      referer: 'http://elsewhere'
    }
  }, 'http://origin')
    .then(() => {
      t.ok(true, 'it should yield to the next middleware')
    })
    .catch(e => {
      // should not be called
      t.notOk(true, 'it should not throw an error')
    })
})
