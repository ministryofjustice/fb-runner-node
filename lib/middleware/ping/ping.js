require('@ministryofjustice/module-alias/register-module')(module)

const {
  APP_SHA,
  SERVICE_SHA
} = require('~/fb-runner-node/constants/constants')

const payload = {
  APP_SHA,
  SERVICE_SHA
}

function init () {
  return (req, res) => res.json(payload)
}

module.exports = {
  init
}
