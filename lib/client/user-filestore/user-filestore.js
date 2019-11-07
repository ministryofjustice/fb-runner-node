require('module-alias/register')

const FBUserFileStoreClient = require('@ministryofjustice/fb-user-filestore-client-node')
const metrics = require('~/client/metrics/metrics')
const {SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, USER_FILESTORE_URL} = require('~/constants/constants')

let userFileStoreClient
if (USER_FILESTORE_URL) {
  userFileStoreClient = new FBUserFileStoreClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, USER_FILESTORE_URL)
} else {
  userFileStoreClient = FBUserFileStoreClient.offline()
}

const {apiMetrics, requestMetrics} = metrics.getMetricsClient()
userFileStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = userFileStoreClient
