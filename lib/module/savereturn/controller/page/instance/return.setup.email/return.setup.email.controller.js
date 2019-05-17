const {client, getEmailMessage} = require('../../../savereturn')

const ReturnEmailController = {}

ReturnEmailController.postValidation = async (pageInstance, userData) => {
  try {
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const email = userData.getUserDataProperty('email')

    const message = getEmailMessage('email.return.setup.email.token', userData)

    await client.createSetupEmailToken(userId, userToken, email, message)
  } catch (e) {
    throw e
  }
  return pageInstance
}

module.exports = ReturnEmailController
