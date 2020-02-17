require('@ministryofjustice/module-alias/register-module')(module)

const FBUserFileStoreClient = require('@ministryofjustice/fb-client/lib/user/filestore/client')
const metrics = require('~/fb-runner-node/client/metrics/metrics')

const {
  SERVICE_SECRET,
  SERVICE_SLUG,
  USER_FILESTORE_URL,
  ENCODED_PRIVATE_KEY
} = require('~/fb-runner-node/constants/constants')

const {
  apiMetrics,
  requestMetrics
} = metrics.getMetricsClient()

const userFileStoreClient = USER_FILESTORE_URL
  ? new FBUserFileStoreClient(SERVICE_SECRET, SERVICE_SLUG, USER_FILESTORE_URL, { encodedPrivateKey: ENCODED_PRIVATE_KEY })
  : FBUserFileStoreClient.offline()

userFileStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = userFileStoreClient
