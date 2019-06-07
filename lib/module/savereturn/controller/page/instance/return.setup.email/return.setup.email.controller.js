const {client, sendEmail, getConfig} = require('../../../savereturn')

const ReturnEmailController = {}

ReturnEmailController.postValidation = async (pageInstance, userData) => {
  try {
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const email = userData.getUserDataProperty('email')
    const duration = getConfig('emailTokenDuration')

    const {token} = await client.createSetupEmailToken(userId, userToken, email, duration)

    await sendEmail('email.return.setup.email.token', userData, {token})
  } catch (e) {
    throw e
  }
  return pageInstance
}

module.exports = ReturnEmailController
