const {client, sendEmail} = require('../../../savereturn')

const ReturnEmailController = {}

ReturnEmailController.postValidation = async (pageInstance, userData) => {
  try {
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const email = userData.getUserDataProperty('email')

    const {token} = await client.createSetupEmailToken(userId, userToken, email)

    await sendEmail('email.return.setup.email.token', userData, {token})
  } catch (e) {
    throw e
  }
  return pageInstance
}

module.exports = ReturnEmailController
