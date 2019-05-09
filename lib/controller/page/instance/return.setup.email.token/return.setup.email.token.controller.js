const saveReturnClient = require('../../../../client/save-return/save-return')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const ReturnEmailTokenController = {}

ReturnEmailTokenController.preUpdate = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const token = userData.getUserParam('token')
  const passphrase = userData.getUserParam('passphrase')
  try {
    const {details} = await saveReturnClient.validateSetupEmailToken(token, passphrase)
    console.log({details})
    // const {userId, userToken} = details
    // await userData.resetUserData(userId, userToken)
  } catch (e) {
    if (e.code && e.message) {
      pageInstance.redirect = `return.setup.email.${e.message}`
    } else {
      throw e
    }
  }
  return pageInstance
}

module.exports = ReturnEmailTokenController
