const saveReturnClient = require('../../../../client/save-return')
const {getInstanceProperty} = require('../../../../../../service-data/service-data')
const {getFullyQualifiedUrl} = require('../../../../../../route/route')

const ReturnEmailController = {}

ReturnEmailController.postValidation = async (pageInstance, userData) => {
  try {
    const email = userData.getUserDataProperty('email')
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const tokenUrl = getInstanceProperty('return.setup.email.token', 'url')
    const linkTemplate = getFullyQualifiedUrl(tokenUrl)

    await saveReturnClient.createSetupEmailToken(email, userId, userToken, linkTemplate)
  } catch (e) {
    throw new Error(500)
  }
  return pageInstance
}

module.exports = ReturnEmailController
