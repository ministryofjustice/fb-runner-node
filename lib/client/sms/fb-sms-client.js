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
   * @param {object} payload
   * SMS data
   *
   * @param {object} options
   * SMS send options
   *
   * @return {promise<undefined>}
   *
   **/
  async sendMessage (payload, options) {
    const endpointUrl = '/sms'

    payload.service_slug = this.serviceSlug

    try {
      const response = await this.sendPost({
        url: endpointUrl,
        payload
      })
      return response
    } catch (e) {
      if (options.throwOnError) {
        throw e
      }
      return {}
    }
  }
}

module.exports = FBSMSClient
