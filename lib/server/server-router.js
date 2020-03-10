const express = require('express')
const router = express.Router()

const configureMiddleware = require('./server-middleware')

module.exports = function getRouter (options) {
  configureMiddleware(options)
    .forEach((route) => {
      if (Array.isArray(route)) {
        router.use(...route)
      } else {
        router.use(route)
      }
    })

  return router
}
