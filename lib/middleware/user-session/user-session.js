require('@ministryofjustice/module-alias/register-module')(module)

const express = require('express')
const router = express.Router()
const cookieParser = require('cookie-parser')

const aes256 = require('aes256')

const user = require('~/fb-runner-node/user/user')
const { getInstanceProperty } = require('~/fb-runner-node/service-data/service-data')
const { getUrl } = require('~/fb-runner-node/route/route')

const {
  PLATFORM_ENV,
  ROUTES: {
    ping: PING_URL,
    keepAlive: KEEP_ALIVE_URL,
    healthcheck: HEALTHCHECK_URL
  }
} = require('~/fb-runner-node/constants/constants')

// In minutes
// This is a fallback. The actual default session duration is defined here:
// https://github.com/ministryofjustice/fb-components/blob/master/metadata/config/service.json
// Can be overriden by a forms own service.json definition
const defaultSessionTimeout = 20

let serviceSecret

const fakeSession = {}

let sessionName
let secure
let cookiePath
let cookieMaxAge

function genid (userId = user.createUserId(), userToken = user.createUserToken()) {
  const userDigest = user.createUserDigest(userId, userToken, serviceSecret)
  const userDigestBundle = {
    userId,
    userToken,
    userDigest
  }

  return JSON.stringify(userDigestBundle)
}

function setSessionCookie (res, encryptedDigestBundle) {
  res.cookie(sessionName, encryptedDigestBundle, {
    httpOnly: true,
    secure,
    cookiePath,
    maxAge: 60 * 1000 * cookieMaxAge
  })
}

function createSessionCookie (res, userId, userToken) {
  const digestBundle = genid(userId, userToken)
  const encryptedDigestBundle = aes256.encrypt(serviceSecret, digestBundle)
  setSessionCookie(res, encryptedDigestBundle)
  return encryptedDigestBundle
}

function createSessionAndRedirect (res, redirect = 'page.start') {
  createSessionCookie(res)
  return res.redirect(getUrl(redirect))
}

function clearSessionCookie (res) {
  res.clearCookie('sessionId')
}

function clearSessionAndRedirect (res, redirect = 'page.start') {
  clearSessionCookie(res)
  return res.redirect(getUrl(redirect))
}

function addUserIdTokenMethods (req, userId, userToken) {
  req.getUserId = () => userId
  req.getUserToken = () => userToken
}

function sessionDuration () {
  return getInstanceProperty('service', 'sessionDuration', defaultSessionTimeout)
}

function getSessionOptions (options = {}) {
  return Object.assign({}, {
    sessionName: 'sessionId',
    secure: !!PLATFORM_ENV,
    cookiePath: '/',
    cookieMaxAge: sessionDuration()
  }, options)
}

function init (options = {}) {
  // set secure: true when proper environments
  const sessionOptions = getSessionOptions(options)

  sessionName = sessionOptions.sessionName
  secure = sessionOptions.secure
  cookiePath = sessionOptions.cookiePath
  cookieMaxAge = sessionOptions.cookieMaxAge
  serviceSecret = sessionOptions.serviceSecret || '<NONE>'

  return router
    .use(cookieParser())
    .use((req, res, next) => {
      const { originalUrl } = req

      /*
       *  Exclude requests to the ping, healthcheck, and keepAlive routes
       */
      if (originalUrl !== PING_URL && originalUrl !== HEALTHCHECK_URL && originalUrl !== KEEP_ALIVE_URL) {
        let encryptedDigestBundle = req.cookies[sessionName]

        if (!encryptedDigestBundle) {
          //  Brand new session
          req.newSession = true
          encryptedDigestBundle = createSessionCookie(res)
        } else {
          // keep cookie rolling
          setSessionCookie(res, encryptedDigestBundle)
        }

        const digestBundle = aes256.decrypt(serviceSecret, encryptedDigestBundle)

        let userValues = {}
        try {
          if (digestBundle) {
            userValues = JSON.parse(digestBundle)
          }
        } catch (e) {
          // cookie was invalid
          return createSessionAndRedirect(res)
        }

        const { userId, userToken, userDigest } = userValues
        const isValidUser = user.validateUserDigest(userId, userToken, userDigest, serviceSecret)
        if (!isValidUser) {
          return createSessionAndRedirect(res) // if not on the first page
        }

        // TODO move loading of data here out of user-data and pass saveData in

        if (!fakeSession[encryptedDigestBundle]) {
          fakeSession[encryptedDigestBundle] = {}
        }

        req.session = fakeSession[encryptedDigestBundle]

        addUserIdTokenMethods(req, userId, userToken)
      }

      return next()
    })
}

const external = {
  init,
  clearSessionCookie,
  clearSessionAndRedirect,
  createSessionCookie,
  createSessionAndRedirect,
  getSessionOptions,
  sessionDuration
}

module.exports = external
