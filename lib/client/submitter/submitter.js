require('@ministryofjustice/module-alias/register-module')(module)

const FBSubmitterClient = require('@ministryofjustice/fb-client/lib/submitter/client')

const metrics = require('~/fb-runner-node/client/metrics/metrics')

const {
  SERVICE_SECRET,
  SERVICE_SLUG,
  SUBMITTER_URL,
  ENCODED_PRIVATE_KEY
} = require('~/fb-runner-node/constants/constants')

const submitterClient = SUBMITTER_URL
  ? new FBSubmitterClient(SERVICE_SECRET, SERVICE_SLUG, SUBMITTER_URL, ENCODED_PRIVATE_KEY)
  : FBSubmitterClient.offline()

const {
  apiMetrics,
  requestMetrics
} = metrics.getMetricsClient()

submitterClient.setMetricsInstrumentation(apiMetrics, requestMetrics)

module.exports = submitterClient
