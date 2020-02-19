require('@ministryofjustice/module-alias/register-module')(module)

const CommonController = require('~/fb-runner-node/module/savereturn/controller/page/common')

const {
  client,
  sendEmail,
  getConfig
} = require('~/fb-runner-node/module/savereturn/controller/savereturn')

module.exports = class SetupEmailController extends CommonController {
  async postValidation (pageInstance, userData) {
    const userId = userData.getUserId()
    const userToken = userData.getUserToken()
    const email = userData.getUserDataProperty('email')
    const duration = getConfig('emailTokenDuration')

    const token = await client.createSetupEmailToken(userId, userToken, email, duration, userData.logger)

    await sendEmail('email.return.setup.email.token', userData, { token })

    return pageInstance
  }
}
