const FBEmailClient = require('./fb-email-client')

const {SERVICE_TOKEN, SERVICE_SLUG, EMAIL_URL, SERVICE_SECRET} = require('../../constants/constants')

// no op methods for save return client
let emailClient = {
  send: () => {}
}

// initialise save return client
if (EMAIL_URL) {
  emailClient = new FBEmailClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, EMAIL_URL)
}

module.exports = emailClient
