const FBSubmitterClient = require('@ministryofjustice/fb-submitter-client-node')
const metrics = require('../metrics/metrics')
const {SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SUBMITTER_URL} = require('../../constants/constants')

let submitterClient
if (SUBMITTER_URL) {
  submitterClient = new FBSubmitterClient(SERVICE_SECRET, SERVICE_TOKEN, SERVICE_SLUG, SUBMITTER_URL)
} else {
  submitterClient = FBSubmitterClient.offline()
}

const {apiMetrics, requestMetrics} = metrics.getMetricsClient()
submitterClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = submitterClient
