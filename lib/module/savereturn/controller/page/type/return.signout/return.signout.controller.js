require('@ministryofjustice/module-alias/register-module')(module)

const cloneDeep = require('lodash.clonedeep')

const CommonController = require('~/fb-runner-node/module/savereturn/controller/page/common')

module.exports = class SignoutController extends CommonController {
  async preUpdateContents (instance, userData) {
    const pageInstance = cloneDeep(instance)
    userData.clearSession()
    userData.unsetUserDataProperty('authenticated')
    userData.unsetUserDataProperty('email')

    return pageInstance
  }
}
