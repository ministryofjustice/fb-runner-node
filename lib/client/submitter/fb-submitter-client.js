const FBJWTClient = require('@ministryofjustice/fb-jwt-client-node')
class FBSubmitterClientError extends FBJWTClient.prototype.ErrorClass {}

// endpoint urls
const endpoints = {
  submit: '/submission',
  getStatus: '/submission/:submissionId'
}

/**
 * Creates submitter client
 * @class
 */
class FBSubmitterClient extends FBJWTClient {
  /**
   * Initialise submitter client
   *
   * @param {string} serviceSecret
   * Service secret
   *
   * @param {string} serviceToken
   * Service token
   *
   * @param {string} serviceSlug
   * Service slug
   *
   * @param {string} submitterUrl
   * Submitter microservice URL
   *
   * @return {object}
   * Submitter client
   *
   **/
  constructor (serviceSecret, serviceToken, serviceSlug, submitterUrl) {
    super(serviceSecret, serviceToken, serviceSlug, submitterUrl, FBSubmitterClientError)
  }

  /**
   * Get status of submission
   *
   * @param {string} submissionId
   * Submission ID
   *
   * @param {object} logger
   * Bunyan logger instance
   *
   * @return {promise<object>}
   * Promise resolving to object containing submission status
   *
   **/
  async getStatus (submissionId, logger) {
    const url = endpoints.getStatus

    return this.sendGet({
      url,
      context: {submissionId}
    }, logger)
  }

  /**
   * Submit user submission tasks
   *
   * @param {object} args
   * Submission args
   *
   * @param {string} args.userId
   * User ID
   *
   * @param {string} args.userToken
   * User token
   *
   * @param {array} args.submissions
   * List of output instructions
   *
   * @param {object} logger
   * Bunyan logger instance
   *
   * @return {promise<undefined>}
   *
   **/
  async submit (submission, userId, userToken, logger) {
    const url = endpoints.submit

    /* eslint-disable camelcase */
    const service_slug = this.serviceSlug
    const encrypted_user_id_and_token = this.encryptUserIdAndToken(userId, userToken)
    /* eslint-enable camelcase */

    const payload = Object.assign(
      { service_slug,encrypted_user_id_and_token },
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
