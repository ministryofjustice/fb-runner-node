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
    const {getPath, getAll, setPath, setAll} = user
    t.ok(true, 'it should call the next function')
    t.equal(typeof user, 'object', 'it should create req.user object')
    t.equal(typeof getPath, 'function', 'it should add getPath method')
    t.equal(typeof getAll, 'function', 'it should add getAll method')
    t.equal(typeof setPath, 'function', 'it should add setPath method')
    t.equal(typeof setAll, 'function', 'it should add setAll method')
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
    const {getPath, getAll} = req.user
    t.equal(getPath('a[b]'), true, 'it should get specific values')
    t.deepEqual(getAll(), {a: {b: true}}, 'it should add getAll method')
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
    const {setPath, setAll} = req.user
    t.equal(setPath('a[b]', 'value'), 'value', 'it should be able to set specific values')
    t.equal(setPath('z[y]', 'value'), 'value', 'it should be able to set specific values')
    t.deepEqual(setAll({a: {b: true}}), {a: {b: true}, z: {y: 'value'}}, 'it should be able to replace all the user data')
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
    const {unsetPath, getPath} = req.user
    unsetPath('a[b]')
    t.equal(getPath('a[b]'), undefined, 'it should unset specific values')
    t.equal(unsetPath('z[y]'), true, 'it should be handle unsetting undefined values')
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
