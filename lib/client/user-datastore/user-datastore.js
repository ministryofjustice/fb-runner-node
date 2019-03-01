const FBUserDataStoreClient = require('@ministryofjustice/fb-user-datastore-client-node')

const {SERVICE_TOKEN, SERVICE_SLUG, USER_DATASTORE_URL, SERVICE_SECRET} = require('../../constants/constants')

// initialise user datastore client
let userDataStoreClient
if (USER_DATASTORE_URL) {
  userDataStoreClient = new FBUserDataStoreClient(SERVICE_TOKEN, SERVICE_SLUG, USER_DATASTORE_URL, SERVICE_SECRET)
}

module.exports = userDataStoreClient
