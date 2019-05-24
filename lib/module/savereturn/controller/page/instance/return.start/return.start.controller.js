const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, sendEmail, getConfig} = require('../../../savereturn')

const ReturnStartController = {}

ReturnStartController.postValidation = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)

  try {
    const email = userData.getUserDataProperty('email')
    const duration = getConfig('emailTokenDuration')

    const {token} = await client.createMagiclink(email, duration)
    await sendEmail('email.return.signin.email', userData, {token})
  } catch (err) {
    throw err
  }

  return pageInstance
}

module.exports = ReturnStartController
