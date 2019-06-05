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
        const iv = key === 'encrypted_email' ? this.serviceToken : undefined
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
   * @param {string} userId
   * User Id
   *
   * @param {string} userToken
   * User Token
   *
   * @param {string} email
   * Email address (plain text)
   *
   * @param {mumber} duration
   * How long until token expires (hours)
   *
   * @return {promise<object>}
   *
   **/
  async createSetupEmailToken (userId, userToken, email, duration) {
    const encryptedDetails = {
      userId,
      userToken,
      email
    }
    return this.sendPost('/setup/email/add', {
      encrypted_email: email,
      encrypted_details: encryptedDetails,
      duration
    })
  }

  /**
   * Request the sending of a code to a user in order for user to validate mobile number prior to setting up a savereturn record
   *
   * @param {string} userId
   * User Id
   *
   * @param {string} userToken
   * User Token
   *
   * @param {string} email
   * Email (plain text)
   *
   * @param {string} mobile
   * Mobile (plain text)
   *
   * @param {mumber} duration
   * How long until code expires (minutes)
   *
   * @return {promise<object>}
   *
   **/
  async createSetupMobileCode (userId, userToken, email, mobile, duration) {
    const encryptedDetails = {
      userId,
      userToken,
      email,
      mobile
    }

    return this.sendPost('/setup/mobile/add', {
      encrypted_email: email,
      encrypted_details: encryptedDetails,
      duration
    })
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

    return this.sendPost('/setup/email/validate', payload)
  }

  /**
   * Validate user’s mobile code
   *
   * @param {string} code
   * Code
   *
   * @param {string} encryptedEmail
   * Encrypted email
   *
   * @return {promise<object>}
   *
   **/
  async validateSetupMobileCode (code, encryptedEmail) {
    const payload = {
      code,
      encrypted_email: encryptedEmail
    }

    return this.sendPost('/setup/mobile/validate', payload)
  }

  /**
   * Create a save and return record
   *
   * @param {string} userId
   * User Id
   *
   * @param {string} userToken
   * User Token
   *
   * @param {string} email
   * Email (plain text)
   *
   * @param {string} [mobile]
   * Mobile number (plain text)
   *
   * @return {promise<object>}
   **/
  async createRecord (userId, userToken, email, mobile) {
    const encryptedDetails = {
      userId,
      userToken,
      email
    }
    if (mobile) {
      encryptedDetails.mobile = mobile
    }

    const payload = {
      encrypted_email: email,
      encrypted_details: encryptedDetails
    }

    return this.sendPost('/record/create', payload)
  }

  /**
   * Request a magiclink for a user
   *
   * @param {string} email
   * Email (plain text)
   *
   * @param {mumber} duration
   * How long until token expires (hours)
   *
   * @return {promise<object>}
   **/
  async createMagiclink (email, duration) {
    const payload = {
      encrypted_email: email,
      duration
    }

    return this.sendPost('/signin/email/add', payload)
  }

  /**
   * Validate user’s magiclink
   *
   * @param {string} magiclink
   * Email (plain text)
   *
   * @return {promise<object>}
   *
   **/
  async validateAuthenticationMagiclink (magiclink) {
    const payload = {
      magiclink
    }

    return this.sendPost('/signin/email/validate', payload)
  }

  /**
   * Request a signin code to provide 2fa
   *
   * @param {string} email
   * Email (plain text)
   *
   * @param {mumber} duration
   * How long until code expires (minutes)
   *
   * @return {promise<object>}
   *
   **/
  async createSigninMobileCode (email, duration) {
    return this.sendPost('/signin/mobile/add', {
      encrypted_email: email,
      duration
    })
  }

  /**
   * Validate user’s signin code
   *
   * @param {string} code
   * Mobile (plain text)
   *
   * @param {string} email
   * Email (plain text)
   *
   * @return {promise<object>}
   *
   **/
  async validateSigninMobileCode (code, email) {
    const payload = {
      code,
      encrypted_email: email
    }

    return this.sendPost('/signin/mobile/validate', payload)
  }
}

module.exports = FBSaveReturnClient