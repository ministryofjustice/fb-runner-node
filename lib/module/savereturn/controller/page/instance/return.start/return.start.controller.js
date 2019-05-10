const {deepClone} = require('@ministryofjustice/fb-utils-node')
const saveReturnClient = require('../../../../client/save-return')
const {getInstanceProperty} = require('../../../../../../service-data/service-data')
const {getFullyQualifiedUrl} = require('../../../../../../route/route')

const ReturnStartController = {}

ReturnStartController.postValidation = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const email = userData.getUserDataProperty('email')
  const magiclink = getInstanceProperty('return.authentication.magiclink', 'url')
  const validationUrl = getFullyQualifiedUrl(magiclink)

  try {
    await saveReturnClient.createMagiclink(email, validationUrl)
  } catch (err) {
    throw err
  }

  return pageInstance
}

module.exports = ReturnStartController
