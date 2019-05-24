const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, resetUser, authenticate, getSmsMessage, sendEmail, sendSMS, getConfig} = require('../../../savereturn')

const ReturnAuthenticationMagiclinkController = {}

ReturnAuthenticationMagiclinkController.preUpdateContents = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const magiclink = userData.getUserParam('magiclink')
  try {
    const {details} = await client.validateAuthenticationMagiclink(magiclink)
    const {mobile, email} = details
    await resetUser(userData, details)

    if (mobile) {
      const duration = getConfig('smsCodeDuration')
      const {code} = await client.createSigninMobileCode(email, duration)

      await sendSMS('sms.return.signin.mobile', userData, {code})

      pageInstance.redirect = 'return.signin.code.sent'
      return pageInstance
    }

    authenticate(userData, 'signin-magiclink')
    await sendEmail('email.return.signin.success', userData)

    pageInstance.redirect = 'return.authenticated'
  } catch (e) {
    if (e.code === 401 && e.message) {
      pageInstance.redirect = `return.signin.${e.message}`
    } else {
      throw e
    }
  }
  return pageInstance
}

module.exports = ReturnAuthenticationMagiclinkController
