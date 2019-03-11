const {SERVICE_TOKEN, SERVICE_SLUG, SUBMITTER_URL, SERVICE_SECRET} = require('../../constants/constants')

const FBSubmitterClient = require('@ministryofjustice/fb-submitter-client-node')

// initialise user datastore client
let submitterClient = {
  submit: () => {},
  encryptUserIdAndToken: userId => userId,
  decryptUserIdAndToken: encryptedUser => encryptedUser
}
if (SUBMITTER_URL) {
  submitterClient = new FBSubmitterClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SUBMITTER_URL)
}

module.exports = submitterClient
