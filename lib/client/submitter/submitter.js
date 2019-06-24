const {SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SUBMITTER_URL} = require('../../constants/constants')

const FBSubmitterClient = require('@ministryofjustice/fb-submitter-client-node')

let submitterClient
if (SUBMITTER_URL) {
  submitterClient = new FBSubmitterClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SUBMITTER_URL)
} else {
  submitterClient = FBSubmitterClient.offline()
}

module.exports = submitterClient
