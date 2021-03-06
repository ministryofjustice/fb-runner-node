require('@ministryofjustice/module-alias/register-module')(module)

const FBUserDataStoreClient = require('@ministryofjustice/fb-client/lib/user/datastore/client')

const metrics = require('~/fb-runner-node/client/metrics/metrics')

const {
  SERVICE_SECRET,
  SERVICE_SLUG,
  USER_DATASTORE_URL,
  ENCODED_PRIVATE_KEY
} = require('~/fb-runner-node/constants/constants')

const {
  apiMetrics,
  requestMetrics
} = metrics.getMetricsClient()

const userDataStoreClient = USER_DATASTORE_URL
  ? new FBUserDataStoreClient(SERVICE_SECRET, SERVICE_SLUG, USER_DATASTORE_URL, ENCODED_PRIVATE_KEY)
  : { offline: true, setMetricsInstrumentation: () => {} }

userDataStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = userDataStoreClient
