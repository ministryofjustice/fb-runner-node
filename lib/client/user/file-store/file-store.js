require('@ministryofjustice/module-alias/register-module')(module)

const FBUserFileStoreClient = require('@ministryofjustice/fb-user/lib/file-store/client')
const metrics = require('~/fb-runner-node/client/metrics/metrics')
const {SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, USER_FILESTORE_URL} = require('~/fb-runner-node/constants/constants')

let userFileStoreClient
if (USER_FILESTORE_URL) {
  userFileStoreClient = new FBUserFileStoreClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, USER_FILESTORE_URL)
} else {
  userFileStoreClient = FBUserFileStoreClient.offline()
}

const {apiMetrics, requestMetrics} = metrics.getMetricsClient()
userFileStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = userFileStoreClient
