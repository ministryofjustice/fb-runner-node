const saveReturnClient = require('../../../../client/save-return/save-return')

const ReturnEmailCheckController = {}

ReturnEmailCheckController.postValidation = async (pageInstance, userData) => {
  // can this be modelled in the data?
  // also, alternative data bucket
  if (userData.getUserDataProperty('email_correct') !== 'yes') {
    return pageInstance
  }
  /* eslint-disable camelcase */
  const email_for_sending = userData.getUserDataProperty('email')
  /* eslint-enable camelcase */
  try {
    // pass email as encrypt option to post
    // create email_details bundle - NB. how would that play with alternative data bucket
    const email = saveReturnClient.encrypt(saveReturnClient.serviceSecret, email_for_sending, 'gosh')
    await saveReturnClient.post('/email/add', {
      email,
      email_for_sending,
      email_details: 'woooo',
      link_template: 'gosh'
    })
  } catch (e) {
    throw new Error(500)
  }
  return pageInstance
}

module.exports = ReturnEmailCheckController
