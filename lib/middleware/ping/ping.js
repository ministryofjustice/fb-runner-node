const {APP_SHA, SERVICE_SHA, COMPONENTS_MODULE, COMPONENTS_VERSION, ROUTES} = require('../../constants/constants')
const pingPayload = {
  APP_SHA,
  SERVICE_SHA,
  COMPONENTS_MODULE,
  COMPONENTS_VERSION
}

const init = (options = {}) => {
  const PING_URL = options.url || ROUTES.ping
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

/*
app.use('/ping.json', ping.ping)
app.use(ping.init())
app.use(ping.init({url: '/wag'}))
*/
