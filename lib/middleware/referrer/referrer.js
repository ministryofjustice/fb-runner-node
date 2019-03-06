
// Short-circuit posts with incorrect referrer
// but let internal traffic through
const {FBError} = require('@ministryofjustice/fb-utils-node')
const init = (fqd) => {
  return (req, res, next) => {
    if (!req.headers['x-forwarded-host'] || !fqd) {
      return next()
    }
    if (req.method === 'POST') {
      let disallowed
      let referrer = req.headers['referer']
      // let referrer = req.get('referrer')
      if (!referrer) {
        disallowed = 'ENOREFERRER'
      } else {
        referrer = referrer.replace(/(^https{0,1}:\/\/[^/]+)\/.*?$/, '$1')
        if (referrer !== fqd) {
          disallowed = 'EINVALIDREFERRER'
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
    next()
  }
}

module.exports = {
  init
}
