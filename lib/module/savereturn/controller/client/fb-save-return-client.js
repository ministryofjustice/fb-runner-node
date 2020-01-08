const FBJWTClient = require('@ministryofjustice/fb-client/lib/user/jwt/client')
class SaveReturnClientError extends FBJWTClient.prototype.ErrorClass {}

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
    super(serviceSecret, serviceToken, serviceSlug, saveReturnUrl, SaveReturnClientError)
  }

  /**
   * Post to save return API
   *
   * @param {object} args
   * Post args
   *
   * @param {string} args.url
   * URL pattern
   *
   * @param {object} args.payload
   * User data
   *
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @return {promise<undefined>}
   *
   **/
  async sendPost (args, logger) {
    const {url, payload} = args
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
    const postArgs = Object.assign({}, args, {
      url: `${baseUrl}${url}`,
      context: {serviceSlug},
      payload: encryptedPayload
    })
    const response = await super.sendPost(postArgs, logger)
    Object.keys(response).forEach(key => {
      if (key.startsWith('encrypted_')) {
        response[key.replace(/^encrypted_/, '')] = this.decrypt(this.serviceSecret, response[key])
      }
    })
    return response
  }

  /**
   *
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @property {string} token
   *
   * @return {promise<token>}
   *
   **/
  async createSetupEmailToken (userId, userToken, email, duration, logger) {
    const encryptedDetails = {
      userId,
      userToken,
      email
    }
    const result = await this.sendPost({
      url: '/setup/email/add',
      payload: {
        encrypted_email: email,
        encrypted_details: encryptedDetails,
        duration
      }
    }, logger)
    return result.token
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @property {string} code
   *
   * @return {promise<code>}
   *
   **/
  async createSetupMobileCode (userId, userToken, email, mobile, duration, logger) {
    const encryptedDetails = {
      userId,
      userToken,
      email,
      mobile
    }

    const result = await this.sendPost({
      url: '/setup/mobile/add',
      payload: {
        encrypted_email: email,
        encrypted_details: encryptedDetails,
        duration
      }
    }, logger)
    return result.code
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @property {object} details
   *
   * @return {promise<details>}
   *
   **/
  async validateSetupEmailToken (emailToken, passphrase, logger) {
    const payload = {
      email_token: emailToken
    }

    if (passphrase) {
      payload.encrypted_passphrase = passphrase
    }

    const result = await this.sendPost({
      url: '/setup/email/validate',
      payload
    }, logger)
    return result.details
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @property {object} details
   *
   * @return {promise<details>}
   *
   **/
  async validateSetupMobileCode (code, encryptedEmail, logger) {
    const result = await this.sendPost({
      url: '/setup/mobile/validate',
      payload: {
        code,
        encrypted_email: encryptedEmail
      }
    }, logger)
    return result.details
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @return {promise<undefined>}
   **/
  async createRecord (userId, userToken, email, mobile, logger) {
    const encryptedDetails = {
      userId,
      userToken,
      email
    }
    if (mobile) {
      encryptedDetails.mobile = mobile
    }

    return this.sendPost({
      url: '/record/create',
      payload: {
        encrypted_email: email,
        encrypted_details: encryptedDetails
      }
    }, logger)
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @property {string} token
   *
   * @return {promise<token>}
   *
   **/
  async createMagiclink (email, duration, logger) {
    const result = await this.sendPost({
      url: '/signin/email/add',
      payload: {
        encrypted_email: email,
        duration
      }
    }, logger)
    return result.token
  }

  /**
   * Validate user’s magiclink
   *
   * @param {string} magiclink
   * Email (plain text)
   *
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @property {object} details
   *
   * @return {promise<details>}
   *
   **/
  async validateAuthenticationMagiclink (magiclink, logger) {
    const result = await this.sendPost({
      url: '/signin/email/validate',
      payload: {
        magiclink
      }
    }, logger)
    return result.details
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @property {string} code
   *
   * @return {promise<code>}
   *
   **/
  async createSigninMobileCode (email, duration, logger) {
    const result = await this.sendPost({
      url: '/signin/mobile/add',
      payload: {
        encrypted_email: email,
        duration
      }
    }, logger)
    return result.code
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @property {object} details
   *
   * @return {promise<details>}
   *
   **/
  async validateSigninMobileCode (code, email, logger) {
    const result = await this.sendPost({
      url: '/signin/mobile/validate',
      payload: {
        code,
        encrypted_email: email
      }
    }, logger)
    return result.details
  }
}

module.exports = FBSaveReturnClient
