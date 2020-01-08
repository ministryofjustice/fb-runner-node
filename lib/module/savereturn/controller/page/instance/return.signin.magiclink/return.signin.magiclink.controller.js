require('@ministryofjustice/module-alias/register-module')(module)

const cloneDeep = require('lodash.clonedeep')
const {client, handleValidationError, resetUser, authenticate, sendEmail, sendSMS, getConfig} = require('~/fb-runner-node/module/savereturn/controller/savereturn')

const ReturnAuthenticationMagiclinkController = {}

ReturnAuthenticationMagiclinkController.preUpdateContents = async (instance, userData) => {
  const pageInstance = cloneDeep(instance)
  const magiclink = userData.getUserParam('magiclink')
  try {
    const details = await client.validateAuthenticationMagiclink(magiclink, userData.logger)
    const {mobile, email} = details
    await resetUser(userData, details)

    if (mobile) {
      const duration = getConfig('smsCodeDuration')
      const code = await client.createSigninMobileCode(email, duration, userData.logger)

      await sendSMS('sms.return.signin.mobile', userData, {code})

      pageInstance.redirect = 'return.signin.mobile.validate'
      return pageInstance
    }

    authenticate(userData, 'signin-magiclink')
    await sendEmail('email.return.signin.success', userData)

    pageInstance.redirect = 'return.authenticated'
  } catch (e) {
    return handleValidationError(e, 'return.signin.magiclink')
  }
  return pageInstance
}

module.exports = ReturnAuthenticationMagiclinkController
