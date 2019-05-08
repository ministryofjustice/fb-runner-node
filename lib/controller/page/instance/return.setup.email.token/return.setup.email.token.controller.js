const saveReturnClient = require('../../../../client/save-return/save-return')

const ReturnEmailTokenController = {}

ReturnEmailTokenController.preUpdate = async (pageInstance, userData) => {
  const token = userData.getUserParam('token')
  const passphrase = userData.getUserParam('passphrase')
  try {
    const {details} = await saveReturnClient.validateSetupEmailToken(token, passphrase)
    const {userId, userToken} = details
    await userData.resetUserData(userId, userToken)
  } catch (e) {
    throw new Error(500)
  }
  return pageInstance
}

module.exports = ReturnEmailTokenController
