require('@ministryofjustice/module-alias/register-module')(module)

const CommonError = require('~/fb-runner-node/error')

// Short-circuit posts with incorrect referrer
// but let internal traffic through
const init = (fqd) => {
  return (req, res, next) => {
    if (!req.get('x-forwarded-host') || !fqd) {
      return next()
    }
    if (req.method === 'POST') {
      let disallowed
      let referrer = req.get('referer')
      if (!referrer) {
        disallowed = 'ENOREFERRER'
      } else {
        referrer = referrer.replace(/(^https{0,1}:\/\/[^/]+)\/.*?$/, '$1')
        if (referrer !== fqd) {
          disallowed = 'EINVALIDREFERRER'
        }
      }
      if (disallowed) {
        throw new CommonError({
          error: {
            code: disallowed,
            message: 403
          }
        })
      }
    }
    next()
  }
}

module.exports = {
  init
}
