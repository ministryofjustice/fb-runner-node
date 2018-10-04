const express = require('express')

const router = express.Router()
const session = require('express-session')

const user = require('../../user/user')

const external = {}

external.init = (options = {}) => {
  // set secure: true when proper environments
  const actualOptions = Object.assign({}, {
    sessionName: 'sessionId',
    secure: false,
    cookiePath: '/',
    cookieMaxAge: 30,
    serviceToken: '<NONE>'
  }, options)

  const {
    sessionName,
    secure,
    cookiePath,
    cookieMaxAge,
    serviceToken
  } = actualOptions

  const genid = (req) => {
    const genidArgs = req.genidArgs || {}
    const userId = genidArgs.userId || user.createUserId()
    const userToken = genidArgs.userToken || user.createUserToken()
    const userDigest = user.createUserDigest(userId, userToken, serviceToken)
    const userBundle = {
      userId,
      userToken,
      userDigest
    }
    return JSON.stringify(userBundle)
  }

  router.use(session({
    name: sessionName,
    resave: false,
    saveUninitialized: false,
    secret: Math.round(Math.random() * 100000).toString(),
    cookie: {
      path: cookiePath,
      httpOnly: false,
      secure,
      maxAge: cookieMaxAge * 60 * 1000,
      rolling: true
    },
    genid
  }))
  // rolling will enable the session to potentially live longer than the data in the store
  // store the creation date?

  router.use((req, res, next) => {
    let userValues = {}
    const sessionID = req.sessionID
    try {
      if (sessionID) {
        userValues = JSON.parse(sessionID)
      }
    } catch (e) {
    // cookie was invalid - NB. express-session should have spotted the session cookie is invalid before it gets here
    }
    const {userId, userToken, userDigest} = userValues
    const isValidUser = user.validateUserDigest(userId, userToken, userDigest, serviceToken)
    if (!isValidUser) {
      throw new Error(400)
    }

    req.userId = userId
    req.userToken = userToken
    next()
  })

  // TODO: Notes to self on how args might be 'arbitrarily' passed to genid
  // router.use((req, res, next) => {
  //   if (Math.random() > 0.9) {
  //     req.genidArgs = {
  //       userId: 'twiddle',
  //       userToken: 'ohgollyohmolly'
  //     }
  //   }
  //   next()
  // })
  // router.use((req, res, next) => {
  //   if (req.genidArgs) {
  //     req.session.regenerate((err) => {
  //       if (err) {
  //         throw new Error('Session regeneration went wrong')
  //       }
  //       next()
  //     })
  //   } else {
  //     next()
  //   }
  // })
  return router
}

module.exports = external
