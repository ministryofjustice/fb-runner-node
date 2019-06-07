const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, resetUser, authenticate, sendEmail} = require('../../../savereturn')

const ReturnEmailTokenController = {}

ReturnEmailTokenController.preUpdateContents = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const token = userData.getUserParam('token')
  const passphrase = userData.getUserParam('passphrase')
  try {
    const {details} = await client.validateSetupEmailToken(token, passphrase)

    await resetUser(userData, details)

    // unless mandatory 2fa
    const {userId, userToken, email} = details

    await client.createRecord(userId, userToken, email)
    await sendEmail('email.return.setup.email.verified', userData)

    authenticate(userData, 'setup-email')

    pageInstance.redirect = 'return.setup.success'
  } catch (e) {
    if (e.code === 401 && e.message) {
      pageInstance.redirect = `return.setup.email.${e.message}`
    } else {
      throw e
    }
  }
  return pageInstance
}

module.exports = ReturnEmailTokenController
