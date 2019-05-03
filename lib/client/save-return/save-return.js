const FBSaveReturnClient = require('./fb-save-return-client')

const {SERVICE_TOKEN, SERVICE_SLUG, SAVE_RETURN_URL, SERVICE_SECRET} = require('../../constants/constants')

// no op methods for save return client
let saveReturnClient = {
  encrypt: () => {},
  decrypt: () => {},
  post: async () => {}
}

// initialise save return client
if (SAVE_RETURN_URL) {
  saveReturnClient = new FBSaveReturnClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SAVE_RETURN_URL)
}

module.exports = saveReturnClient
