const FBSMSClient = require('./fb-sms-client')

const {SERVICE_TOKEN, SERVICE_SLUG, SMS_URL, SERVICE_SECRET} = require('../../constants/constants')

// no op methods for sms client
let emailClient = {
  send: () => {}
}

// initialise sms client
if (SMS_URL) {
  emailClient = new FBSMSClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SMS_URL)
}

module.exports = emailClient
