require('@ministryofjustice/module-alias/register-module')(module)

const FBSMSClient = require('@ministryofjustice/fb-client/lib/sms/client')

const {
  SERVICE_SLUG,
  SMS_URL,
  SERVICE_SECRET
} = require('~/fb-runner-node/constants/constants')

module.exports = SMS_URL
  ? new FBSMSClient(SERVICE_SECRET, SERVICE_SLUG, SMS_URL) // initialise sms client
  : { sendMessage: () => {} } // no op methods for sms client
