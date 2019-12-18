require('@ministryofjustice/module-alias/register-module')(module)

const FBSubmitterClient = require('./client')

const metrics = require('~/fb-runner-node/client/metrics/metrics')
const {SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SUBMITTER_URL} = require('~/fb-runner-node/constants/constants')

let submitterClient
if (SUBMITTER_URL) {
  submitterClient = new FBSubmitterClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SUBMITTER_URL)
} else {
  submitterClient = FBSubmitterClient.offline()
}

const {apiMetrics, requestMetrics} = metrics.getMetricsClient()
submitterClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = submitterClient
