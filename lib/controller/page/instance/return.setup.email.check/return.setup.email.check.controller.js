const saveReturnClient = require('../../../../client/save-return/save-return')

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
    const encryptedEmail = email
    const encryptedDetails = {
      userId,
      userToken,
      email
    }

    await saveReturnClient.post('/email/add', {
      email,
      encrypted_email: encryptedEmail,
      encrypted_details: encryptedDetails,
      link_template: '/woo/woo'
    })
  } catch (e) {
    throw new Error(500)
  }
  return pageInstance
}

module.exports = ReturnEmailCheckController
