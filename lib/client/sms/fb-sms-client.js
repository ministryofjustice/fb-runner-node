const FBJWTClient = require('@ministryofjustice/fb-jwt-client-node')
class FBSMSClientError extends FBJWTClient.prototype.ErrorClass {}

/**
 * Creates SMS client
 * @class
 */
class FBSMSClient extends FBJWTClient {
  /**
   * Initialise SMS client
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
   * @param {string} smsUrl
   * Email endpoint URL
   *
   * @return {object}
   *
   **/
  constructor (serviceSecret, serviceToken, serviceSlug, smsUrl) {
    super(serviceSecret, serviceToken, serviceSlug, smsUrl, FBSMSClientError)
  }

  /**
   * Post to sms API
   *
   * @param {object} message
   * SMS data
   *
   * @param {object} [options]
   * SMS send options
   *
   * @param {object} [options.logger]
   * Bunyan logger instance
   *
   * @return {promise<undefined>}
   *
   **/
  async sendMessage (message, options = {}) {
    const endpointUrl = '/sms'

    const payload = {
      message
    }
    payload.service_slug = this.serviceSlug

    return this.sendPost({
      url: endpointUrl,
      payload
    }, options.logger)
  }
}

module.exports = FBSMSClient
