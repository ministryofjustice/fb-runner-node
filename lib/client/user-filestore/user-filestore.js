// const FBUserFileStoreClient = require('@ministryofjustice/fb-user-filestore-client-node')

// const {USER_FILESTORE_URL, SERVICE_TOKEN, SERVICE_SLUG} = require('../../constants/constants')

// // initialise user filestore client
// let userFileStoreClient
// if (USER_FILESTORE_URL) {
//   userFileStoreClient = new FBUserFileStoreClient(SERVICE_TOKEN, SERVICE_SLUG, USER_FILESTORE_URL)
// }

let userFileStoreClient = {
  save: (file) => {
    return new Promise((resolve, reject) => {
      // if (error) {
      //   reject({value
      //     file,
      //     error
      //   })
      // }
      resolve({
        file,
        value: {
          timestamp: new Date().toString()
        }
      })
    })
  },
  fetch: () => {}
}

module.exports = userFileStoreClient
