require('@ministryofjustice/module-alias/register-module')(module)

const express = require('express')
const router = express.Router()
const cookieParser = require('cookie-parser')

const aes256 = require('aes256')

const user = require('~/fb-runner-node/user/user')
const {getInstanceProperty} = require('~/fb-runner-node/service-data/service-data')
const {getUrl} = require('~/fb-runner-node/route/route')

const {PLATFORM_ENV} = require('~/fb-runner-node/constants/constants')

let serviceSecret

const fakeSession = {}

const genid = (
  userId = user.createUserId(),
  userToken = user.createUserToken()
) => {
  const userDigest = user.createUserDigest(userId, userToken, serviceSecret)
  const userDigestBundle = {
    userId,
    userToken,
    userDigest
  }
  return JSON.stringify(userDigestBundle)
}

let
  sessionName,
  secure,
  cookiePath,
  cookieMaxAge

const setSessionCookie = (res, encryptedDigestBundle) => {
  res.cookie(sessionName, encryptedDigestBundle, {
    httpOnly: true,
    secure,
    cookiePath,
    maxAge: 60 * 1000 * cookieMaxAge
  })
}

const createSessionCookie = (res, userId, userToken) => {
  const digestBundle = genid(userId, userToken)
  const encryptedDigestBundle = aes256.encrypt(serviceSecret, digestBundle)
  setSessionCookie(res, encryptedDigestBundle)
  return encryptedDigestBundle
}

const createSessionAndRedirect = (res, redirect = 'page.start') => {
  createSessionCookie(res)
  return res.redirect(getUrl(redirect))
}

const clearSession = (res) => {
  res.clearCookie('sessionId')
}

const clearSessionAndRedirect = (res, redirect = 'page.start') => {
  clearSession(res)
  if (redirect) {
    return res.redirect(getUrl(redirect))
  }
}

const addUserIdTokenMethods = (req, userId, userToken) => {
  req.getUserId = () => userId
  req.getUserToken = () => userToken
}

const init = (options = {}) => {
  // set secure: true when proper environments
  const sessionDuration = getInstanceProperty('service', 'sessionDuration', 30) // defaults to 30 minutes
  const actualOptions = Object.assign({}, {
    sessionName: 'sessionId',
    secure: !!PLATFORM_ENV,
    cookiePath: '/',
    cookieMaxAge: sessionDuration
  }, options)

  sessionName = actualOptions.sessionName
  secure = actualOptions.secure
  cookiePath = actualOptions.cookiePath
  cookieMaxAge = actualOptions.cookieMaxAge

  serviceSecret = actualOptions.serviceSecret || '<NONE>'

  router.use(cookieParser())

  router.use((req, res, next) => {
    let encryptedSessionId = req.cookies[sessionName]
    if (!encryptedSessionId) {
      //  Brand new session
      req.newSession = true
      encryptedSessionId = createSessionCookie(res)
    } else {
      // keep cookie rolling
      setSessionCookie(res, encryptedSessionId)
    }
    const sessionId = aes256.decrypt(serviceSecret, encryptedSessionId)

    let userValues = {}
    try {
      if (sessionId) {
        userValues = JSON.parse(sessionId)
      }
    } catch (e) {
      // cookie was invalid
      return createSessionAndRedirect(res)
    }

    const {userId, userToken, userDigest} = userValues
    const isValidUser = user.validateUserDigest(userId, userToken, userDigest, serviceSecret)
    if (!isValidUser) {
      return createSessionAndRedirect(res) // if not on the first page
    }

    // TODO move loading of data here out of user-data and pass saveData in

    if (!fakeSession[encryptedSessionId]) {
      fakeSession[encryptedSessionId] = {}
    }
    req.session = fakeSession[encryptedSessionId]
    addUserIdTokenMethods(req, userId, userToken)

    next()
  })
  return router
}

const external = {
  init,
  clearSession,
  clearSessionAndRedirect,
  createSessionCookie,
  createSessionAndRedirect
}

module.exports = external
