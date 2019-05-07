const express = require('express')
const router = express.Router()
const cookieParser = require('cookie-parser')

const aes256 = require('aes256')

const submitterClient = require('../../client/submitter/submitter')
const user = require('../../user/user')

const fakeSession = {}

const external = {}

external.init = (options = {}) => {
  // set secure: true when proper environments
  const actualOptions = Object.assign({}, {
    sessionName: 'sessionId',
    secure: false,
    cookiePath: '/',
    cookieMaxAge: 30 // minutes
  }, options)

  const {
    sessionName,
    secure,
    cookiePath,
    cookieMaxAge
  } = actualOptions

  let {serviceSecret} = actualOptions
  serviceSecret = serviceSecret || '<NONE>'

  const genid = (userId, userToken) => {
    userId = userId || user.createUserId()
    userToken = userToken || user.createUserToken()
    const userDigest = user.createUserDigest(userId, userToken, serviceSecret)
    const userDigestBundle = {
      userId,
      userToken,
      userDigest
    }
    return JSON.stringify(userDigestBundle)
  }

  const setSessionCookie = (res, encryptedDigestBundle) => {
    res.cookie(sessionName, encryptedDigestBundle, {
      httpOnly: true,
      secure,
      cookiePath,
      maxAge: 60 * 1000 * cookieMaxAge
    })
  }

  const createSessionCookie = (res) => {
    const digestBundle = genid()
    const encryptedDigestBundle = aes256.encrypt(serviceSecret, digestBundle)
    setSessionCookie(res, encryptedDigestBundle)
    return encryptedDigestBundle
  }

  const addUserIdTokenMethods = (req, userId, userToken) => {
    req.getUserId = () => userId
    req.getUserToken = () => userToken
  }

  router.use(cookieParser())

  router.use((req, res, next) => {
    let userIdAndToken = req.headers['x-encrypted-user-id-and-token']
    if (userIdAndToken) {
      if (req.method !== 'GET') {
        throw new Error(403)
      }
      try {
        const userDetails = submitterClient.decryptUserIdAndToken(userIdAndToken)
        if (!userDetails.userId) {
          throw new Error(403)
        }
        const {userId, userToken} = userDetails
        req.session = {}
        addUserIdTokenMethods(req, userId, userToken)
      } catch (e) {
        throw e
      }
      next()
      return
    }

    let encrypedSessionId = req.cookies[sessionName]
    if (!encrypedSessionId) {
      //  Brand new session
      req.newSession = true
      encrypedSessionId = createSessionCookie(res)
    } else {
      // keep cookie rolling
      setSessionCookie(res, encrypedSessionId)
    }
    const sessionId = aes256.decrypt(serviceSecret, encrypedSessionId)

    let userValues = {}
    try {
      if (sessionId) {
        userValues = JSON.parse(sessionId)
      }
    } catch (e) {
      // cookie was invalid
      createSessionCookie(res)
      return res.redirect('/')
    }

    const {userId, userToken, userDigest} = userValues
    const isValidUser = user.validateUserDigest(userId, userToken, userDigest, serviceSecret)
    if (!isValidUser) {
      createSessionCookie(res)
      return res.redirect('/') // if not on the first page - also, will go awry if first page is off the site?
    }

    // TODO move loading of data here out of user-data and pass saveData in

    if (!fakeSession[encrypedSessionId]) {
      fakeSession[encrypedSessionId] = {}
    }
    req.session = fakeSession[encrypedSessionId]
    addUserIdTokenMethods(req, userId, userToken)

    next()
  })
  return router
}

module.exports = external
