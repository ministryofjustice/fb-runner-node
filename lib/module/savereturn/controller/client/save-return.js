const FBSaveReturnClient = require('./fb-save-return-client')

const {SERVICE_TOKEN, SERVICE_SLUG, SAVE_RETURN_URL, SERVICE_SECRET} = require('../../../../constants/constants')

// no op methods for save return client
const noop = () => {}
let saveReturnClient = {
  encrypt: noop,
  decrypt: noop,
  createSetupEmailToken: noop,
  validateSetupEmailToken: noop
}

// initialise save return client
if (SAVE_RETURN_URL) {
  saveReturnClient = new FBSaveReturnClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SAVE_RETURN_URL)
}

module.exports = saveReturnClient
