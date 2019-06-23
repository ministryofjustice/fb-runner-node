const FBUserFileStoreClient = require('@ministryofjustice/fb-user-filestore-client-node')

const {USER_FILESTORE_URL, SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG} = require('../../constants/constants')

// initialise user filestore client
let userFileStoreClient = {
  store: async (userId, userToken, file, profile) => {
    return new Promise((resolve) => {
      resolve({
        fingerprint: file,
        date: new Date().getTime(),
        timestamp: new Date().toString()
      })
    })
  },
  storeFromPath: async (userId, userToken, file, profile) => {
    return userFileStoreClient.store(userId, userToken, file, profile)
  },
  fetch: async () => {},
  getFetchUrl: (userId, fingerprint) => `/service/${SERVICE_SLUG}/user/${userId}/${fingerprint}`
}
// initialise actual user filestore client
if (USER_FILESTORE_URL) {
  userFileStoreClient = new FBUserFileStoreClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, USER_FILESTORE_URL)
}

module.exports = userFileStoreClient
