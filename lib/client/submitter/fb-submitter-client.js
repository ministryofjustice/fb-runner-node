const FBJWTClient = require('@ministryofjustice/fb-jwt-client-node')
class FBSubmitterClientError extends FBJWTClient.prototype.ErrorClass {}

// endpoint urls
const endpoints = {
  submit: '/submission',
  getStatus: '/submission/:submissionId'
}

class FBSubmitterClient extends FBJWTClient {
  constructor (serviceSecret, serviceToken, serviceSlug, submitterUrl) {
    super(serviceSecret, serviceToken, serviceSlug, submitterUrl, FBSubmitterClientError)
  }

  async getStatus (submissionId, logger) {
    const url = endpoints.getStatus

    return this.sendGet({
      url,
      context: {submissionId}
    }, logger)
  }

  async submit (submission, userId, userToken, logger) {
    const url = endpoints.submit

    /* eslint-disable camelcase */
    const service_slug = this.serviceSlug
    const encrypted_user_id_and_token = this.encryptUserIdAndToken(userId, userToken)
    /* eslint-enable camelcase */

    const payload = Object.assign(
      {service_slug, encrypted_user_id_and_token},
      submission
    )
    console.log(payload)
    console.log(JSON.stringify(payload))

    await this.sendPost({url, payload}, logger)
  }
}

FBSubmitterClient.offline = () => {
  class FBSubmitterClientOffline extends FBSubmitterClient {
    async submit () {}
  }
  return new FBSubmitterClientOffline('SERVICE_SECRET', 'SERVICE_TOKEN', 'SERVICE_SLUG', 'SUBMITTER_URL')
}

module.exports = FBSubmitterClient
