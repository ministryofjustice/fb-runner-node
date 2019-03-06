const {FBError} = require('@ministryofjustice/fb-utils-node')
const csrfToken = require('csrf-token')

const getTokenSecret = (userId, token) => {
  // hash this?
  return userId + token
}
const verifyCsrfToken = async (secret, token) => {
  return csrfToken.verify(secret, token)
}
const createCsrfToken = async (secret) => {
  return csrfToken.create(secret)
}

const init = (token) => {
  return async (req, res, next) => {
    if (!req.headers['x-forwarded-host']) {
      return next()
    }
    const userId = req.user.userId
    const secret = getTokenSecret(userId, token)
    if (req.method === 'POST') {
      const contentType = req.headers['content-type']
      // const contentType = req.get('content-type')
      if (!contentType.startsWith('multipart/form-data;')) {
        let disallowed
        const {_csrf} = req.body
        if (!_csrf) {
          disallowed = 'ECSRFTOKENMISSING'
        } else {
          const verified = await verifyCsrfToken(secret, _csrf)
          if (!verified) {
            disallowed = 'ECSRFTOKENINVALID'
          }
        }
        if (disallowed) {
          return next(new FBError({
            error: {
              code: disallowed,
              message: 403
            }
          }))
        }
      }
    }
    res.locals._csrf = await createCsrfToken(secret)
    next()
  }
}

module.exports = {
  init
}
