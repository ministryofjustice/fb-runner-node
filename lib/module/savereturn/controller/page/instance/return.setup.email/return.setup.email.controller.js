const {client} = require('../../shared/shared')
const {getInstanceProperty} = require('../../../../../../service-data/service-data')
const {getFullyQualifiedUrl} = require('../../../../../../route/route')

const ReturnEmailController = {}

ReturnEmailController.postValidation = async (pageInstance, userData) => {
  try {
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const email = userData.getUserDataProperty('email')
    const tokenUrl = getInstanceProperty('return.setup.email.token', 'url')
    const validationUrl = getFullyQualifiedUrl(tokenUrl)

    await client.createSetupEmailToken(userId, userToken, email, validationUrl)
  } catch (e) {
    throw e
  }
  return pageInstance
}

module.exports = ReturnEmailController
