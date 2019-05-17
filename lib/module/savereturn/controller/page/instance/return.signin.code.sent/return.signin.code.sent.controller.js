const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, resetUser, authenticate, sendEmail} = require('../../../savereturn')

const ReturnSigninMobileValidateController = {}

ReturnSigninMobileValidateController.postValidation = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const code = userData.getUserDataProperty('signin_code')
  userData.unsetUserDataProperty('signin_code')
  const email = userData.getUserDataProperty('email')
  try {
    const {details} = await client.validateSigninMobileCode(code, email)

    await resetUser(userData, details)
    authenticate(userData, 'signin-code')
    sendEmail('email.return.signin.success', userData)

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

module.exports = ReturnSigninMobileValidateController
