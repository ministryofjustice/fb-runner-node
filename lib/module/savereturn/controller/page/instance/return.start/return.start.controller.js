const {deepClone} = require('@ministryofjustice/fb-utils-node')
const {client} = require('../../shared/shared')
const {getInstanceProperty} = require('../../../../../../service-data/service-data')
const {getFullyQualifiedUrl} = require('../../../../../../route/route')

const ReturnStartController = {}

ReturnStartController.postValidation = async (pageInstance, userData) => {
  pageInstance = deepClone(pageInstance)
  const email = userData.getUserDataProperty('email')
  const magiclink = getInstanceProperty('return.signin.magiclink', 'url')
  const validationUrl = getFullyQualifiedUrl(magiclink)

  try {
    await client.createMagiclink(email, validationUrl)
  } catch (err) {
    throw err
  }

  return pageInstance
}

module.exports = ReturnStartController
