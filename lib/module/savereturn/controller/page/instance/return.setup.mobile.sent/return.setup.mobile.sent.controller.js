const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, resetUser, authenticate, sendEmail} = require('../../../savereturn')

const ReturnSetupMobileValidateController = {}

ReturnSetupMobileValidateController.postValidation = async (instance, userData) => {
  const pageInstance = deepClone(instance)
  const code = userData.getUserDataProperty('code')
  const email = userData.getUserDataProperty('email')
  try {
    const {details} = await client.validateSetupMobileCode(code, email)

    await resetUser(userData, details)

    const {userId, userToken} = details
    const mobile = userData.getUserDataProperty('mobile')

    await client.createRecord(userId, userToken, email, mobile)
    await sendEmail('email.return.setup.mobile.verified', userData)

    authenticate(userData, 'setup-mobile')

    pageInstance.redirect = 'return.setup.success'
  } catch (e) {
    if (e.code === 401 && e.message) {
      pageInstance.redirect = `return.setup.mobile.${e.message}`
    } else {
      throw e
    }
  }
  return pageInstance
}

module.exports = ReturnSetupMobileValidateController
