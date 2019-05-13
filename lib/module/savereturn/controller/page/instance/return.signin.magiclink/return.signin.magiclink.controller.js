const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, resetUser, authenticate} = require('../../shared/shared')

const ReturnAuthenticationMagiclinkController = {}

ReturnAuthenticationMagiclinkController.preUpdate = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const magiclink = userData.getUserParam('magiclink')
  try {
    const {details} = await client.validateAuthenticationMagiclink(magiclink)
    const {mobile, email} = details

    if (mobile) {
      await client.createSigninMobileCode(mobile, email)
      pageInstance.redirect = 'return.signin.code.sent'
      return pageInstance
    }

    resetUser(userData, details)
    authenticate(userData, 'signin-magiclink')
    // send email to user noting sign in ?

    pageInstance.redirect = 'return.authenticated'
  } catch (e) {
    if (e.code === 401 && e.message) {
      pageInstance.redirect = `return.signin.magiclink.${e.message}`
    } else {
      throw e
    }
  }
  return pageInstance
}

module.exports = ReturnAuthenticationMagiclinkController
