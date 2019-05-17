const {client, getSmsMessage} = require('../../../savereturn')

const ReturnSetupMobileController = {}

ReturnSetupMobileController.postValidation = async (pageInstance, userData) => {
  try {
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const email = userData.getUserDataProperty('email')
    const mobile = userData.getUserDataProperty('mobile')

    const message = getSmsMessage('sms.return.setup.mobile', userData)

    await client.createSetupMobileCode(userId, userToken, email, mobile, message)
  } catch (e) {
    throw e
  }
  return pageInstance
}

module.exports = ReturnSetupMobileController
