const basicAuth = require('express-basic-auth')

const authorizeMiddleware = {
  callBasicAuth: (options) => {
    return basicAuth(Object.assign({challenge: true}, options))
  },

  createAuthorize: (username, password, realm) => {
    const basicAuthInstance = authorizeMiddleware.callBasicAuth({
      users: {
        [username]: password
      },
      realm
    })
    const authorize = (req, res, next) => {
      if (req.connection.remoteAddress.includes('127.0.0.1')) {
        return next()
      }
      basicAuthInstance(req, res, next)
    }
    return authorize
  },

  init: (credentials = {
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
    realm: process.env.REALM
  }) => {
    const {username, password, realm} = credentials
    if (!username) {
      return (req, res, next) => {
        next()
      }
    }
    return authorizeMiddleware.createAuthorize(username, password, realm)
  }
}
module.exports = authorizeMiddleware
