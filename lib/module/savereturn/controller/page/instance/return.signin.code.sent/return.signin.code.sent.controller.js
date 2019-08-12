const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, handleValidationError, resetUser, authenticate, sendEmail} = require('../../../savereturn')

const ReturnSigninMobileValidateController = {}

ReturnSigninMobileValidateController.preUpdateContents = async (pageInstance, userData) => {
  const email = userData.getUserDataProperty('email')
  const mobile = userData.getUserDataProperty('mobile')
  if (!email || !mobile) {
    pageInstance.redirect = 'return.start'
  }
  return pageInstance
}

ReturnSigninMobileValidateController.postValidation = async (instance, userData) => {
  const code = userData.getUserDataProperty('signin_code')
  if (!code) {
    return instance
  }
  const pageInstance = deepClone(instance)
  userData.unsetUserDataProperty('signin_code')
  const email = userData.getUserDataProperty('email')
  try {
    const details = await client.validateSigninMobileCode(code, email, userData.logger)

    await resetUser(userData, details)
    authenticate(userData, 'signin-code')
    await sendEmail('email.return.signin.success', userData)

    pageInstance.redirect = 'return.authenticated'
  } catch (e) {
    if (e.message && e.message === 'code.invalid') {
      return pageInstance
    }
    return handleValidationError(e, 'return.signin')
  }
  return pageInstance
}

module.exports = ReturnSigninMobileValidateController
