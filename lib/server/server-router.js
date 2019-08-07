const express = require('express')
const router = express.Router()

const configureMiddleware = require('./server-middleware')

const getRouter = (app, options = {}) => {
  const middleware = configureMiddleware(app, options)

  middleware.forEach(route => {
    if (Array.isArray(route)) {
      router.use(...route)
    } else {
      router.use(route)
    }
  })

  return router
}

module.exports = getRouter
