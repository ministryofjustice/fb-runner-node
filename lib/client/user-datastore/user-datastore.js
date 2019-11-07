require('module-alias/register')

const FBUserDataStoreClient = require('@ministryofjustice/fb-user-datastore-client-node')
const metrics = require('~/client/metrics/metrics')
const {SERVICE_TOKEN, SERVICE_SLUG, USER_DATASTORE_URL, SERVICE_SECRET} = require('~/constants/constants')

// initialise user datastore client
let userDataStoreClient = {
  offline: true,
  setMetricsInstrumentation: () => {}
}
if (USER_DATASTORE_URL) {
  userDataStoreClient = new FBUserDataStoreClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, USER_DATASTORE_URL)
}

const {apiMetrics, requestMetrics} = metrics.getMetricsClient()
userDataStoreClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = userDataStoreClient
