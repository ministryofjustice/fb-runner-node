require('@ministryofjustice/module-alias/register-module')(module)

const {
  APP_SHA,
  SERVICE_SHA,
  ROUTES: {
    ping: PING_URL
  }
} = require('~/fb-runner-node/constants/constants')

const pingPayload = {
  APP_SHA,
  SERVICE_SHA
}

function init () {
  return (req, res, next) => {
    if (req.originalUrl === PING_URL) {
      ping(req, res)
    } else {
      next()
    }
  }
}

const ping = (req, res) => {
  res.json(pingPayload)
}

module.exports = {
  init,
  ping
}
