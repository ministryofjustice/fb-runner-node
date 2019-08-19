const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, sendEmail, getConfig} = require('../../../savereturn')

const ReturnStartController = {}

ReturnStartController.postValidation = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)

  const email = userData.getUserDataProperty('email')
  const duration = getConfig('emailTokenDuration')

  try {
    const token = await client.createMagiclink(email, duration, userData.logger)
    await sendEmail('email.return.signin.email', userData, {token})
  } catch (e) {
    if (e.code !== 401 || e.message !== 'email.missing') {
      throw e
    }
  }

  return pageInstance
}

module.exports = ReturnStartController
