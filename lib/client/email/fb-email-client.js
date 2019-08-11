const FBJWTClient = require('@ministryofjustice/fb-jwt-client-node')
class FBEmailClientError extends FBJWTClient.prototype.ErrorClass {}

/**
 * Creates email client
 * @class
 */
class FBEmailClient extends FBJWTClient {
  /**
   * Initialise email client
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
   * @param {string} emailUrl
   * Email endpoint URL
   *
   * @return {object}
   *
   **/
  constructor (serviceSecret, serviceToken, serviceSlug, emailUrl) {
    super(serviceSecret, serviceToken, serviceSlug, emailUrl, FBEmailClientError)
  }

  /**
   * Post to email API
   *
   * @param {object} payload
   * Email data
   *
   * @param {object} [options]
   * Email send options
   *
   * @param {object} [options.logger]
   * Bunyan logger instance
   *
   * @return {promise<undefined>}
   *
   **/
  async sendMessage (payload, options = {}) {
    const url = '/email'

    payload.service_slug = this.serviceSlug

    return this.sendPost({
      url,
      payload
    }, options.logger)
  }
}

module.exports = FBEmailClient
