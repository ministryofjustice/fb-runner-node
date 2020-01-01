require('@ministryofjustice/module-alias/register-module')(module)

const FBUserDataStoreClient = require('@ministryofjustice/fb-client/lib/user/datastore/client')
const metrics = require('~/fb-runner-node/client/metrics/metrics')

const {
  SERVICE_SECRET,
  SERVICE_TOKEN,
  SERVICE_SLUG,
  USER_DATASTORE_URL
} = require('~/fb-runner-node/constants/constants')

const {
  apiMetrics,
  requestMetrics
} = metrics.getMetricsClient()

const userDataStoreClient = USER_DATASTORE_URL
  ? new FBUserDataStoreClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, USER_DATASTORE_URL) // initialise user datastore client
  : {offline: true, setMetricsInstrumentation: () => {}}

userDataStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = userDataStoreClient
