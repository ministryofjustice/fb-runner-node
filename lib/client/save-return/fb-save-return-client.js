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
  async sendPost (urlPattern, payload, encryptedProps) {
    // const iv = this.serviceToken
    const baseUrl = '/service/:serviceSlug/savereturn'
    const serviceSlug = this.serviceSlug
    const encryptedPayload = {}
    Object.keys(payload).forEach(key => {
      let value = payload[key]
      if (key.startsWith('encrypted_')) {
        const iv = key === 'encrypted_' ? this.serviceToken : undefined
        value = this.encrypt(this.serviceSecret, value, iv)
      }
      encryptedPayload[key] = value
    })
    try {
      const response = await super.sendPost(`${baseUrl}${urlPattern}`, {serviceSlug}, encryptedPayload)
      Object.keys(response).forEach(key => {
        if (key.startsWith('encrypted_')) {
          response[key.replace(/^encrypted_/, '')] = this.decrypt(this.serviceSecret, response[key])
        }
      })
      return response
    } catch (e) {
      throw e
    }
  }

  /**
   * Request the sending of an email token to a user in order for user to validate email address prior to setting up a savereturn record
   *
   * @param {string} email
   * Email (plain text)
   *
   * @param {string} userId
   * User Id
   *
   * @param {string} userToken
   * User Token
   *
   * @param {string} linkTemplate
   * Fully-qualified URL pattern
   *
   * @return {promise<object>}
   *
   **/
  async createSetupEmailToken (email, userId, userToken, linkTemplate) {
    const encryptedEmail = email
    const encryptedDetails = {
      userId,
      userToken,
      email
    }

    const response = await this.sendPost('/email/add', {
      email,
      encrypted_email: encryptedEmail,
      encrypted_details: encryptedDetails,
      link_template: linkTemplate
    })
    return response
  }

  /**
   * Validate user’s email token
   *
   * @param {string} emailToken
   * Email (plain text)
   *
   * @param {string} [passphrase]
   * User Id
   *
   * @return {promise<object>}
   *
   **/
  async validateSetupEmailToken (emailToken, passphrase) {
    const payload = {
      email_token: emailToken
    }

    if (passphrase) {
      payload.encrypted_passphrase = passphrase
    }

    const response = await this.sendPost('/email/confirm', payload)
    return response
  }
}

module.exports = FBSaveReturnClient
