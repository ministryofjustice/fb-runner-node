const {client, sendSMS, getConfig} = require('../../../savereturn')

const ReturnSetupMobileController = {}

ReturnSetupMobileController.postValidation = async (pageInstance, userData) => {
  try {
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const email = userData.getUserDataProperty('email')
    const mobile = userData.getUserDataProperty('mobile')
    const duration = getConfig('smsCodeDuration')

    const {code} = await client.createSetupMobileCode(userId, userToken, email, mobile, duration)

    await sendSMS('sms.return.setup.mobile', userData, {code})
  } catch (e) {
    throw e
  }
  return pageInstance
}

module.exports = ReturnSetupMobileController
