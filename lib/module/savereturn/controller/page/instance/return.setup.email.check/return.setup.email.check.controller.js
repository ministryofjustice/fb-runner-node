const saveReturnClient = require('../../../../../../client/save-return/save-return')
const {getInstanceProperty} = require('../../../../../../service-data/service-data')
const {getFullyQualifiedUrl} = require('../../../../../../route/route')

const ReturnEmailCheckController = {}

ReturnEmailCheckController.postValidation = async (pageInstance, userData) => {
  // can this be modelled in the data?
  if (userData.getUserDataProperty('email_correct') !== 'yes') {
    return pageInstance
  }

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

module.exports = ReturnEmailCheckController
