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
   * @param {object} [sendOptions]
   * SMS send options
   *
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @return {promise<undefined>}
   *
   **/
  async sendMessage (message, sendOptions, logger) {
    const url = '/sms'

    const payload = {
      message
    }
    payload.service_slug = this.serviceSlug

    return this.sendPost({
      url,
      payload,
      sendOptions
    }, logger)
  }
}

module.exports = FBSMSClient
