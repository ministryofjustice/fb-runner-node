require('@ministryofjustice/module-alias/register-module')(module)

const FBSMSClient = require('./client')

const {SERVICE_TOKEN, SERVICE_SLUG, SMS_URL, SERVICE_SECRET} = require('~/fb-runner-node/constants/constants')

// no op methods for sms client
let smsClient = {
  send: () => {}
}

// initialise sms client
if (SMS_URL) {
  smsClient = new FBSMSClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SMS_URL)
}

module.exports = smsClient
