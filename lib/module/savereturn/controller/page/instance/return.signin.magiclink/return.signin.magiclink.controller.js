const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, handleValidationError, resetUser, authenticate, sendEmail, sendSMS, getConfig} = require('../../../savereturn')

const ReturnAuthenticationMagiclinkController = {}

ReturnAuthenticationMagiclinkController.preUpdateContents = async (instance, userData) => {
  const pageInstance = deepClone(instance)
  console.log('MAGICK', pageInstance)
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
    console.log('CAME hEre,  authy')
  } catch (e) {
    console.log('CAME hEre,  BLEW UP', e, e.message)
    return handleValidationError(e, 'return.signin')
  }
  console.log('MAGICK 2', pageInstance)
  return pageInstance
}

module.exports = ReturnAuthenticationMagiclinkController
