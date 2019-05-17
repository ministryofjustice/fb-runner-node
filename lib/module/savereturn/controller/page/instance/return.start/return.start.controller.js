const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client, getEmailMessage} = require('../../../savereturn')

const ReturnStartController = {}

ReturnStartController.postValidation = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const email = userData.getUserDataProperty('email')

  try {
    const message = getEmailMessage('email.return.signin.email', userData)

    await client.createMagiclink(email, message)
  } catch (err) {
    throw err
  }

  return pageInstance
}

module.exports = ReturnStartController
