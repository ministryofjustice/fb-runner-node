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
   * Post to save return API
   *
   * @param {string} urlPattern
   * URL pattern
   *
   * @param {object} payload
   * User data
   *
   * @param {array} encryptedProps
   * Payload properties to encrypt
   *
   * @return {promise<undefined>}
   *
   **/
  async post (urlPattern, payload, encryptedProps) {
    const iv = 'gosh'
    const baseUrl = '/service/:serviceSlug/savereturn'
    const serviceSlug = this.serviceSlug
    const encryptedPayload = {}
    Object.keys(payload).forEach(key => {
      let value = payload[key]
      if (key.startsWith('encrypted_')) {
        value = this.encrypt(this.serviceSecret, value, iv)
      }
      encryptedPayload[key] = value
    })
    return this.sendPost(`${baseUrl}${urlPattern}`, {serviceSlug}, encryptedPayload)
  }
}

module.exports = FBSaveReturnClient
