const test = require('tape')

const {load, save} = require('./user-data')

test('When userData is required ', t => {
  t.equal(typeof load, 'function', 'it should export the userData load middleware')
  t.equal(typeof save, 'function', 'it should export the userData save middleware')
  t.end()
})

test('When loading user data', t => {
  t.plan(6)

  const req = {session: {}}
  const res = {}
  const next = () => {
    const user = req.user
    const {getUserDataProperty, getUserData, setUserDataProperty, setUserData} = user
    t.ok(true, 'it should call the next function')
    t.equal(typeof user, 'object', 'it should create req.user object')
    t.equal(typeof getUserDataProperty, 'function', 'it should add getUserDataProperty method')
    t.equal(typeof getUserData, 'function', 'it should add getUserData method')
    t.equal(typeof setUserDataProperty, 'function', 'it should add setUserDataProperty method')
    t.equal(typeof setUserData, 'function', 'it should add setUserData method')
  }
  load(req, res, next)
})

test('When getting user data', t => {
  t.plan(2)

  const req = {
    session: {
      input: {
        a: {
          b: true
        }
      }
    }
  }
  const res = {}
  const next = () => {
    const {getUserDataProperty, getUserData} = req.user
    t.equal(getUserDataProperty('a[b]'), true, 'it should get specific values')
    t.deepEqual(getUserData(), {a: {b: true}}, 'it should add getUserData method')
  }
  load(req, res, next)
})

test('When setting user data', t => {
  t.plan(3)

  const req = {
    session: {
      a: {
        b: 'true'
      }
    }
  }
  const res = {}
  const next = () => {
    const {setUserDataProperty, setUserData} = req.user
    t.equal(setUserDataProperty('a[b]', 'value'), 'value', 'it should be able to set specific values')
    t.equal(setUserDataProperty('z[y]', 'value'), 'value', 'it should be able to set specific values')
    t.deepEqual(setUserData({a: {b: true}}), {a: {b: true}, z: {y: 'value'}}, 'it should be able to replace all the user data')
  }
  load(req, res, next)
})

test('When unsetting user data', t => {
  t.plan(2)

  const req = {
    session: {
      a: {
        b: 'true'
      }
    }
  }
  const res = {}
  const next = () => {
    const {unsetUserDataProperty, getUserDataProperty} = req.user
    unsetUserDataProperty('a[b]')
    t.equal(getUserDataProperty('a[b]'), undefined, 'it should unset specific values')
    t.equal(unsetUserDataProperty('z[y]'), true, 'it should be handle unsetting undefined values')
  }
  load(req, res, next)
})

test('When saving user data', t => {
  t.plan(1)

  const req = {}
  const res = {}
  const next = () => {
    t.ok(true, 'it should call the next function')
  }
  save(req, res, next)
})
