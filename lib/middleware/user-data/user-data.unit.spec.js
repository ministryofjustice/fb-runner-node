const test = require('tape')
const {stub} = require('sinon')

const userDataMethods = require('./user-data')
const {loadUserData, getUserDataMethods} = userDataMethods

test('When userData is required ', t => {
  t.equal(typeof loadUserData, 'function', 'it should export the loadUserData middleware')
  // t.equal(typeof saveUserData, 'function', 'it should export the saveUserData middleware')
  t.end()
})

test('When loading user data', async t => {
  const req = {
    session: {},
    getUserId: () => '',
    getUserToken: () => ''
  }
  const res = {}
  await loadUserData(req, res)
  const user = req.user
  const {
    getUserDataProperty,
    getUserData,
    setUserDataProperty,
    setUserData,
    getUserCountProperty,
    getUserCount,
    setUserCountProperty,
    getUserParam
  } = user
  t.ok(true, 'it should call the next function')
  t.equal(typeof user, 'object', 'it should create req.user object')
  t.equal(typeof getUserDataProperty, 'function', 'it should add getUserDataProperty method')
  t.equal(typeof getUserData, 'function', 'it should add getUserData method')
  t.equal(typeof setUserDataProperty, 'function', 'it should add setUserDataProperty method')
  t.equal(typeof setUserData, 'function', 'it should add setUserData method')
  t.equal(typeof getUserCountProperty, 'function', 'it should add getUserCountProperty method')
  t.equal(typeof getUserCount, 'function', 'it should add getUserCount method')
  t.equal(typeof setUserCountProperty, 'function', 'it should add setUserCountProperty method')
  t.equal(typeof getUserParam, 'function', 'it should add getUserParam method')
  t.end()
})

test('When getting user data', async t => {
  const req = {
    session: {
      input: {
        a: {
          b: true
        }
      }
    },
    getUserId: () => '',
    getUserToken: () => ''
  }
  const res = {}
  await loadUserData(req, res)
  const {getUserDataProperty, getUserData, getAllData} = req.user
  t.equal(getUserDataProperty('a[b]'), true, 'it should get specific values')
  t.deepEqual(getUserData(), {a: {b: true}}, 'it should add getUserData method')
  t.deepEqual(getAllData(), {input: {a: {b: true}}, count: {}, flash: []}, 'it should add getUserData method')
  t.end()
})

test('When setting user data', async t => {
  const req = {
    session: {
      a: {
        b: 'true'
      }
    },
    getUserId: () => '',
    getUserToken: () => ''
  }
  const res = {}
  await loadUserData(req, res)
  const {setUserDataProperty, setUserData} = req.user
  t.equal(setUserDataProperty('a[b]', 'value'), 'value', 'it should be able to set specific values')
  t.equal(setUserDataProperty('z[y]', 'value'), 'value', 'it should be able to set specific values')
  t.deepEqual(setUserData({a: {b: true}}), {a: {b: true}, z: {y: 'value'}}, 'it should be able to replace all the user data')
  t.end()
})

test('When unsetting user data', async t => {
  const req = {
    session: {
      a: {
        b: 'true'
      }
    },
    getUserId: () => '',
    getUserToken: () => ''
  }
  const res = {}
  await loadUserData(req, res)
  const {unsetUserDataProperty, getUserDataProperty} = req.user
  unsetUserDataProperty('a[b]')
  t.equal(getUserDataProperty('a[b]'), undefined, 'it should unset specific values')
  t.equal(unsetUserDataProperty('z[y]'), true, 'it should be handle unsetting undefined values')
  t.end()
})

// test('When saving user data', t => {
//   t.plan(1)

//   const req = {}
//   const res = {}
//   const next = () => {
//     t.ok(true, 'it should call the next function')
//   }
//   saveUserData(req, res, next)
// })

test('When getting count values', t => {
  const userData = getUserDataMethods({
    input: {},
    count: {
      foo: 1,
      'foo[1]bar': 2,
      'foo[1]bar[2]baz': 5
    }
  }, {
    foo: 1,
    bar: 1,
    baz: 1
  }, {
    getUserId: () => {},
    getUserToken: () => {}
  })

  t.equal(userData.getUserParam('baz'), 1, 'it should return correct values for getUserParam')
  t.equal(userData.getUserCountProperty('foo'), 1, 'it should return correct values for getUserParam')
  t.equal(userData.getUserCountProperty('foo[1]bar'), 2, 'it should return correct values for getUserParam')
  t.equal(userData.getUserCountProperty('notthere'), undefined, 'it should return defaulted value for getUserCountProperty when no value exists')
  const getInstanceByPropertyValueStub = stub(userDataMethods, 'getInstanceByPropertyValue')
  const getInstancePropertyStub = stub(userDataMethods, 'getInstanceProperty')
  getInstanceByPropertyValueStub.callsFake((property, value) => {
    if (property === 'namePrefix' && value === 'woo') {
      return {
        _id: 'woot'
      }
    }
  })
  getInstancePropertyStub.callsFake((_id, property) => {
    if (_id === 'woot' && property === 'repeatableMinimum') {
      return 4
    }
  })
  // t.equal(userData.getUserCountProperty('woo'), 4, 'it should return correct values for getUserParam')
  getInstanceByPropertyValueStub.restore()
  getInstancePropertyStub.restore()

  t.deepEqual(userData.getUserCount(), {
    foo: 1,
    'foo[1]bar': 2,
    'foo[1]bar[2]baz': 5
  }, 'it should return correct values for getUserCount')
  userData.setUserCountProperty('foo', 2)
  t.equal(userData.getUserCountProperty('foo'), 2, 'it should set values correctly with setUserCountProperty')

  t.end()
})
