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
    try {
      const response = await super.sendPost(postArgs, logger)
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
   * @param {object} [logger]
   * Bunyan logger instance
   *
   * @return {promise<object>}
   *
   **/
  async createSetupEmailToken (userId, userToken, email, duration, logger) {
    const encryptedDetails = {
      userId,
      userToken,
      email
    }
    return this.sendPost({
      url: '/setup/email/add',
      payload: {
        encrypted_email: email,
        encrypted_details: encryptedDetails,
        duration
      }
    }, logger)
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
   * @return {promise<object>}
   *
   **/
  async createSetupMobileCode (userId, userToken, email, mobile, duration, logger) {
    const encryptedDetails = {
      userId,
      userToken,
      email,
      mobile
    }

    return this.sendPost({
      url: '/setup/mobile/add',
      payload: {
        encrypted_email: email,
        encrypted_details: encryptedDetails,
        duration
      }
    }, logger)
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
   * @return {promise<object>}
   *
   **/
  async validateSetupEmailToken (emailToken, passphrase, logger) {
    const payload = {
      email_token: emailToken
    }

    if (passphrase) {
      payload.encrypted_passphrase = passphrase
    }

    return this.sendPost({
      url: '/setup/email/validate',
      payload
    }, logger)
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
   * @return {promise<object>}
   *
   **/
  async validateSetupMobileCode (code, encryptedEmail, logger) {
    return this.sendPost({
      url: '/setup/mobile/validate',
      payload: {
        code,
        encrypted_email: encryptedEmail
      }
    }, logger)
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
   * @return {promise<object>}
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
    })
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
   * @return {promise<object>}
   **/
  async createMagiclink (email, duration, logger) {
    return this.sendPost({
      url: '/signin/email/add',
      payload: {
        encrypted_email: email,
        duration
      }
    }, logger)
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
   * @return {promise<object>}
   *
   **/
  async validateAuthenticationMagiclink (magiclink, logger) {
    return this.sendPost({
      url: '/signin/email/validate',
      payload: {
        magiclink
      }
    }, logger)
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
   * @return {promise<object>}
   *
   **/
  async createSigninMobileCode (email, duration, logger) {
    return this.sendPost({
      url: '/signin/mobile/add',
      payload: {
        encrypted_email: email,
        duration
      }
    }, logger)
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
   * @return {promise<object>}
   *
   **/
  async validateSigninMobileCode (code, email, logger) {
    return this.sendPost({
      url: '/signin/mobile/validate',
      payload: {
        code,
        encrypted_email: email
      }
    }, logger)
  }
}

module.exports = FBSaveReturnClient
