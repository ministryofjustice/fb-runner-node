
const cloneDeep = require('lodash.clonedeep')

const ReturnSignoutController = {}

ReturnSignoutController.preUpdateContents = async (instance, userData) => {
  const pageInstance = cloneDeep(instance)
  userData.clearSession()
  userData.unsetUserDataProperty('authenticated')
  userData.unsetUserDataProperty('email')

  return pageInstance
}

module.exports = ReturnSignoutController
