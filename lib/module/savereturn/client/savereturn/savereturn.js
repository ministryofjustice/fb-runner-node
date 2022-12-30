require('@ministryofjustice/module-alias/register-module')(module)

const FBSaveReturnClient = require('./client')

const {
  SERVICE_SLUG,
  SAVE_RETURN_URL,
  SERVICE_SECRET,
  ENCODED_PRIVATE_KEY
} = require('~/fb-runner-node/constants/constants')

module.exports = SAVE_RETURN_URL
  ? new FBSaveReturnClient(SERVICE_SECRET, SERVICE_SLUG, SAVE_RETURN_URL, ENCODED_PRIVATE_KEY) // initialise save return client
  : { // no op methods for save return client
      encrypt: () => {},
      decrypt: () => {},
      createSetupEmailToken: () => {},
      createSetupMobileCode: () => {},
      validateSetupEmailToken: () => {},
      validateSetupMobileCode: () => {},
      createRecord: () => {},
      createMagiclink: () => {},
      validateAuthenticationMagiclink: () => {},
      createSigninMobileCode: () => {},
      validateSigninMobileCode: () => {}
    }
