const test = require('tape')
const { stub } = require('sinon')

const userDataMethods = require('./user-data')
const { loadUserData, getUserDataMethods } = userDataMethods

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
  const { getUserDataProperty, getUserData, getAllData } = req.user
  t.equal(getUserDataProperty('a[b]'), true, 'it should get specific values')
  t.same(getUserData(), { a: { b: true } }, 'it should add getUserData method')
  t.same(getAllData(), { input: { a: { b: true } }, count: {}, flash: [] }, 'it should add getUserData method')
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
  const { setUserDataProperty, setUserData } = req.user
  t.equal(setUserDataProperty('a[b]', 'value'), 'value', 'it should be able to set specific values')
  t.equal(setUserDataProperty('z[y]', 'value'), 'value', 'it should be able to set specific values')
  t.same(setUserData({ a: { b: true } }), { a: { b: true }, z: { y: 'value' } }, 'it should be able to replace all the user data')
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
  const { unsetUserDataProperty, getUserDataProperty } = req.user
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

  t.same(userData.getUserCount(), {
    foo: 1,
    'foo[1]bar': 2,
    'foo[1]bar[2]baz': 5
  }, 'it should return correct values for getUserCount')
  userData.setUserCountProperty('foo', 2)
  t.equal(userData.getUserCountProperty('foo'), 2, 'it should set values correctly with setUserCountProperty')

  t.end()
})

test('when there are no uploaded files', async t => {
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
  const { uploadedFiles } = req.user

  t.same(uploadedFiles(), [], 'it returns empty array')
  t.end()
})

test('when there are uploaded files', async t => {
  const req = {
    session: {
      input: {
        a: {
          b: true
        },
        document_upload: [
          {
            fieldname: 'document_upload[1]',
            originalname: 'image.png',
            encoding: '7bit',
            mimetype: 'image/png',
            destination: '/tmp/uploads',
            filename: '2706490942c9ca43b8e1fa01e7dace77',
            path: '/tmp/uploads/2706490942c9ca43b8e1fa01e7dace76',
            size: 74200,
            maxSize: 5242880,
            fingerprint: 1568971532923,
            date: 1568971532922,
            timestamp: 'Fri Sep 20 2019 10:25:32 GMT+0100 (British Summer Time)',
            url: 'SUBMITTER_URL/service/SERVICE_SLUG/user/36c1af3e-a213-4293-8a82-f26ae7a23215/1568971532923',
            uuid: '442e4c33-a364-42a0-9d70-6875ee0c50bc'
          }
        ]
      }
    },
    getUserId: () => '',
    getUserToken: () => '',
    getOutputData: () => {

    }
  }
  const res = {}
  await loadUserData(req, res)
  const { uploadedFiles } = req.user

  const expected = [{
    url: 'SUBMITTER_URL/service/SERVICE_SLUG/user/36c1af3e-a213-4293-8a82-f26ae7a23215/1568971532923',
    mimetype: 'image/png',
    filename: 'image.png',
    type: 'filestore'
  }]

  t.same(uploadedFiles(), expected, 'it returns array of file objects')
  t.end()
})
