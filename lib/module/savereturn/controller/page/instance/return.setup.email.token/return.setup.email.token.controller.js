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

    // unless mandatory 2fa
    const email = userData.getUserDataProperty('email')
    await saveReturnClient.createRecord(email, userId, userToken)

    userData.setUserDataProperty('authenticated', true)
    // log user signed in
    const history = userData.setUserDataProperty('history') || []
    history.push(Date.now())

    pageInstance.redirect = 'return.setup.email.verified'
  } catch (e) {
    if (e.code === 401 && e.message) {
      pageInstance.redirect = `return.setup.email.${e.message}`
    } else {
      throw e
    }
  }
  return pageInstance
}

module.exports = ReturnEmailTokenController
