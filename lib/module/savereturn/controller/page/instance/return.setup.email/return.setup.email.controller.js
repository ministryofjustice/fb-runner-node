const {client, sendEmail, getConfig} = require('../../../savereturn')

const ReturnEmailController = {}

ReturnEmailController.postValidation = async (pageInstance, userData) => {
  const userId = userData.getUserId()
  const userToken = userData.getUserToken()
  const email = userData.getUserDataProperty('email')
  const duration = getConfig('emailTokenDuration')

  const token = await client.createSetupEmailToken(userId, userToken, email, duration, userData.logger)

  await sendEmail('email.return.setup.email.token', userData, {token})

  return pageInstance
}

module.exports = ReturnEmailController
