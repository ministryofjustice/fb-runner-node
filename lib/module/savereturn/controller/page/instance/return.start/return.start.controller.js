const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, sendEmail} = require('../../../savereturn')

const ReturnStartController = {}

ReturnStartController.postValidation = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const email = userData.getUserDataProperty('email')

  try {
    const {token} = await client.createMagiclink(email)
    await sendEmail('email.return.signin.email', userData, {token})
  } catch (err) {
    throw err
  }

  return pageInstance
}

module.exports = ReturnStartController
