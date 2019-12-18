require('@ministryofjustice/module-alias/register-module')(module)

const FBEmailClient = require('./client')

const {SERVICE_TOKEN, SERVICE_SLUG, EMAIL_URL, SERVICE_SECRET} = require('~/fb-runner-node/constants/constants')

// no op methods for email client
let emailClient = {
  send: () => {}
}

// initialise email client
if (EMAIL_URL) {
  emailClient = new FBEmailClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, EMAIL_URL)
}

module.exports = emailClient
