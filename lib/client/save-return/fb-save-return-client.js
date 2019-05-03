const FBJWTClient = require('@ministryofjustice/fb-jwt-client-node')
class FBSaveReturnClientError extends FBJWTClient.prototype.ErrorClass {}

/**
 * Creates save return client
 * @class
 */
class FBSaveReturnClient extends FBJWTClient {
  /**
   * Initialise save return client
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
   * @param {string} saveReturnUrl
   * User datastore URL
   *
   * @return {object}
   *
   **/
  constructor (serviceSecret, serviceToken, serviceSlug, saveReturnUrl) {
    super(serviceSecret, serviceToken, serviceSlug, saveReturnUrl, FBSaveReturnClientError)
  }

  /**
   * Send to save return API
   *
   * @param {string} urlPattern
   * URL pattern
   *
   * @param {object} payload
   * User data
   *
   * @return {promise<undefined>}
   *
   **/
  async post (urlPattern, payload) {
    const baseUrl = '/service/:serviceSlug/savereturn'
    const serviceSlug = this.serviceSlug
    return this.sendPost(`${baseUrl}${urlPattern}`, {serviceSlug}, payload)
  }
}

module.exports = FBSaveReturnClient
