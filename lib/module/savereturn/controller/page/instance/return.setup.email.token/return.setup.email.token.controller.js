const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, handleValidationError, resetUser, authenticate, sendEmail} = require('../../../savereturn')

const ReturnEmailTokenController = {}

ReturnEmailTokenController.preUpdateContents = async (instance, userData) => {
  const pageInstance = deepClone(instance)
  const token = userData.getUserParam('token')
  const passphrase = userData.getUserParam('passphrase')
  try {
    const details = await client.validateSetupEmailToken(token, passphrase, userData.logger)

    await resetUser(userData, details)

    // unless mandatory 2fa
    const {userId, userToken, email} = details

    await client.createRecord(userId, userToken, email)
    await sendEmail('email.return.setup.email.verified', userData)

    authenticate(userData, 'setup-email')

    pageInstance.redirect = 'return.setup.success'
  } catch (e) {
    console.log(e.message, e.code, e)
    return handleValidationError(e, 'return.setup.email')
  }
  return pageInstance
}

module.exports = ReturnEmailTokenController
