const saveReturnClient = require('../../../../client/save-return')
const {deepClone} = require('@ministryofjustice/fb-utils-node')

const ReturnStartController = {}

ReturnStartController.postValidation = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const email = userData.getUserDataProperty('email')

  try {
    await saveReturnClient.createMagiclink({email})
  } catch (err) {
    console.log('There was an error in: ReturnStartController', err)
    // TODO: How to handle this?
    throw new Error(500)
  }

  return pageInstance
}

module.exports = ReturnStartController
