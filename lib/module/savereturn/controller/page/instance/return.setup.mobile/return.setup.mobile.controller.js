const {client, sendSMS, getConfig} = require('../../../savereturn')

const ReturnSetupMobileController = {}

ReturnSetupMobileController.postValidation = async (pageInstance, userData) => {
  const userId = userData.getUserId()
  const userToken = userData.getUserToken()
  const email = userData.getUserDataProperty('email')
  const mobile = userData.getUserDataProperty('mobile')
  const duration = getConfig('smsCodeDuration')

  const code = await client.createSetupMobileCode(userId, userToken, email, mobile, duration, userData.logger)

  await sendSMS('sms.return.setup.mobile', userData, {code})

  return pageInstance
}

module.exports = ReturnSetupMobileController
