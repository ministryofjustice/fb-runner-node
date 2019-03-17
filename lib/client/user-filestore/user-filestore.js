const FBUserFileStoreClient = require('@ministryofjustice/fb-user-filestore-client-node')

const {USER_FILESTORE_URL, SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG} = require('../../constants/constants')

// initialise user filestore client
let userFileStoreClient = {
  store: (file) => {
    return new Promise((resolve) => {
      resolve({
        file,
        value: {
          fingerprint: file.filename,
          size: file.size,
          date: new Date().getTime(),
          timestamp: new Date().toString()
        }
      })
    })
  },
  fetch: () => {}
}
// initialise actual user filestore client
if (USER_FILESTORE_URL) {
  userFileStoreClient = new FBUserFileStoreClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, USER_FILESTORE_URL)
}

module.exports = userFileStoreClient
