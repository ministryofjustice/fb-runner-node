const saveReturnClient = require('../../../../client/save-return')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const ReturnEmailTokenController = {}

ReturnEmailTokenController.preUpdate = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const token = userData.getUserParam('token')
  const passphrase = userData.getUserParam('passphrase')
  try {
    const {details} = await saveReturnClient.validateSetupEmailToken(token, passphrase)
    const {userId, userToken} = details

    await userData.resetUserData(userId, userToken)

    const payload = {
      email: userData.getUserDataProperty('email'),
      userId,
      userToken
    }

    const response = await saveReturnClient.createRecord(payload)
    pageInstance.redirect = `return.setup.email.verified`
  } catch (e) {
    console.log('There was an error in: ReturnEmailTokenController', e);
    if (e.code === 401 && e.message) {
      pageInstance.redirect = `return.setup.email.${e.message}`
    } else {
      throw e
    }
  }
  return pageInstance
}

module.exports = ReturnEmailTokenController
