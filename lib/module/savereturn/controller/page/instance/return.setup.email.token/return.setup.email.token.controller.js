require('@ministryofjustice/module-alias/register-module')(module)

const cloneDeep = require('lodash.clonedeep')
const {client, handleValidationError, resetUser, authenticate, sendEmail} = require('~/fb-runner-node/module/savereturn/controller/savereturn')

const ReturnEmailTokenController = {}

ReturnEmailTokenController.preUpdateContents = async (instance, userData) => {
  const pageInstance = cloneDeep(instance)
  const token = userData.getUserParam('token')
  const passphrase = userData.getUserParam('passphrase')
  try {
    const details = await client.validateSetupEmailToken(token, passphrase, userData.logger)

    await resetUser(userData, details)

    // unless mandatory 2fa
    const {userId, userToken, email} = details

    await client.createRecord(userId, userToken, email, undefined, userData.logger)
    await sendEmail('email.return.setup.email.verified', userData)

    authenticate(userData, 'setup-email')

    pageInstance.redirect = 'return.setup.success'
  } catch (e) {
    return handleValidationError(e, 'return.setup.email')
  }
  return pageInstance
}

module.exports = ReturnEmailTokenController
