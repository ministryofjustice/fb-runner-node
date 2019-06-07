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
   * @param {object} email
   * Email data
   *
   * @param {object} options
   * Email send options
   *
   * @return {promise<undefined>}
   *
   **/
  async send (email, options) {
    const endpointUrl = '/email'

    email.service_slug = this.serviceSlug

    try {
      const response = await this.sendPost(endpointUrl, {}, email)
      return response
    } catch (e) {
      if (options.throwOnError) {
        throw e
      }
      return {}
    }
  }
}

module.exports = FBEmailClient
