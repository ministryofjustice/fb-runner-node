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

let validateCsrf
const validateCsrfProxy = async (csrfToken, userId) => {
  await validateCsrf(csrfToken, userId)
}

const init = (baseToken) => {
  return async (req, res) => {
    /**
     * Validate CSRF token is presnt and matches user ID
     *
     * @param {string} csrfToken
     * CSRF token
     *
     * @param {string} userId
     * User ID
     *
     * @return {undefined}
     *
     * @throws {FBError}
     * If validation fails, thows a 403 with an explanatory code
     */
    validateCsrf = async (csrfToken, userId) => {
      if (!req.get('x-forwarded-host')) {
        return
      }
      let disallowed
      if (!csrfToken) {
        disallowed = 'ECSRFTOKENMISSING'
      } else {
        const secret = getTokenSecret(userId, baseToken)
        const verified = await verifyCsrfToken(secret, csrfToken)
        if (!verified) {
          disallowed = 'ECSRFTOKENINVALID'
        }
      }
      if (disallowed) {
        throw new FBError({
          error: {
            code: disallowed,
            message: 403
          }
        })
      }
    }

    const {getUserId} = req.user
    const userId = getUserId()

    if (req.method === 'POST') {
      const contentType = req.get('content-type')
      if (!contentType.startsWith('multipart/form-data;')) {
        const token = req.body._csrf
        await validateCsrfProxy(token, userId)
      }
    }

    const secret = getTokenSecret(userId, baseToken)
    res.locals._csrf = await createCsrfToken(secret)
  }
}

module.exports = {
  init,
  validateCsrf: validateCsrfProxy
}
