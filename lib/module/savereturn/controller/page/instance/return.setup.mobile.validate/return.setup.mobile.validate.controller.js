require('@ministryofjustice/module-alias/register')

const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, handleValidationError, resetUser, authenticate, sendEmail} = require('~/fb-runner-node/module/savereturn/controller/savereturn')

const ReturnSetupMobileValidateController = {}

ReturnSetupMobileValidateController.preUpdateContents = async (pageInstance, userData) => {
  const authenticated = userData.getUserDataProperty('authenticated')
  if (!authenticated) {
    pageInstance.redirect = 'page.start'
  }
  return pageInstance
}

ReturnSetupMobileValidateController.postValidation = async (instance, userData) => {
  const code = userData.getUserDataProperty('code')
  if (!code) {
    return instance
  }

  const email = userData.getUserDataProperty('email')
  const pageInstance = deepClone(instance)

  try {
    const details = await client.validateSetupMobileCode(code, email, userData.logger)

    await resetUser(userData, details)

    const {userId, userToken} = details
    const mobile = userData.getUserDataProperty('mobile')

    await client.createRecord(userId, userToken, email, mobile, userData.logger)
    await sendEmail('email.return.setup.mobile.verified', userData)

    authenticate(userData, 'setup-mobile')

    pageInstance.redirect = 'return.setup.success'
  } catch (e) {
    if (e.message && e.message === 'code.invalid') {
      return pageInstance
    }
    return handleValidationError(e, 'return.setup.mobile')
  }
  return pageInstance
}

module.exports = ReturnSetupMobileValidateController
