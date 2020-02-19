require('@ministryofjustice/module-alias/register-module')(module)

const cloneDeep = require('lodash.clonedeep')

const CommonController = require('~/fb-runner-node/module/savereturn/controller/page/common')

const {
  client,
  handleValidationError,
  resetUser,
  authenticate,
  sendEmail
} = require('~/fb-runner-node/module/savereturn/controller/savereturn')

module.exports = class SetupMobileValidateController extends CommonController {
  async preUpdateContents (pageInstance, userData) {
    const authenticated = userData.getUserDataProperty('authenticated')
    if (!authenticated) {
      pageInstance.redirect = 'page.start'
    }
    return pageInstance
  }

  async postValidation (instance, userData) {
    const code = userData.getUserDataProperty('code')
    if (!code) {
      return instance
    }

    const email = userData.getUserDataProperty('email')
    const pageInstance = cloneDeep(instance)

    try {
      const details = await client.validateSetupMobileCode(code, email, userData.logger)

      await resetUser(userData, details)

      const { userId, userToken } = details
      const mobile = userData.getUserDataProperty('mobile')

      await client.createRecord(userId, userToken, email, mobile, userData.logger)
      await sendEmail('email.return.setup.mobile.verified', userData)

      authenticate(userData, 'setup-mobile')

      pageInstance.redirect = 'return.setup.success'
    } catch (e) {
      const { message } = e
      if (message === 'code.invalid') {
        return pageInstance
      }

      return handleValidationError(e, 'return.setup.mobile')
    }

    return pageInstance
  }
}
