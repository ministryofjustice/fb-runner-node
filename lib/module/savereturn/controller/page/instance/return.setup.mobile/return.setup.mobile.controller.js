const {client} = require('../../../savereturn')

const ReturnSetupMobileController = {}

ReturnSetupMobileController.postValidation = async (pageInstance, userData) => {
  try {
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const email = userData.getUserDataProperty('email')
    const mobile = userData.getUserDataProperty('mobile')

    await client.createSetupMobileCode(userId, userToken, mobile, email)
  } catch (e) {
    throw e
  }
  return pageInstance
}

module.exports = ReturnSetupMobileController
