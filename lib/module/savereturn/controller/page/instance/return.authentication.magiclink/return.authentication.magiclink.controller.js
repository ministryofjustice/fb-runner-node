const saveReturnClient = require('../../../../client/save-return')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const ReturnAuthenticationMagiclinkController = {}

ReturnAuthenticationMagiclinkController.preUpdate = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const magiclink = userData.getUserParam('magiclink')
  try {
    const {details} = await saveReturnClient.validateAuthenticationMagiclink(magiclink)
    const {userId, userToken} = details

    await userData.resetUserData(userId, userToken)

    // unless mandatory 2fa
    // also
    // - record login in userData
    // - send email to user noting sign in
    pageInstance.redirect = 'return.authenticated'
  } catch (e) {
    if (e.code === 401 && e.message) {
      pageInstance.redirect = `return.authentication.magiclink.${e.message}`
    } else {
      throw e
    }
  }
  return pageInstance
}

module.exports = ReturnAuthenticationMagiclinkController
