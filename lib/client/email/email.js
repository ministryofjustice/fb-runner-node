require('@ministryofjustice/module-alias/register-module')(module)

const FBEmailClient = require('@ministryofjustice/fb-client/lib/email/client')

const {
  SERVICE_SECRET,
  SERVICE_SLUG,
  EMAIL_URL,
  ENCODED_PRIVATE_KEY
} = require('~/fb-runner-node/constants/constants')

module.exports = EMAIL_URL
  ? new FBEmailClient(SERVICE_SECRET, SERVICE_SLUG, EMAIL_URL, ENCODED_PRIVATE_KEY) // initialise email client
  : { sendMessage: () => {} } // no op methods for email client
