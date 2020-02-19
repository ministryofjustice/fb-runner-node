require('@ministryofjustice/module-alias/register-module')(module)

const cloneDeep = require('lodash.clonedeep')

const CommonController = require('~/fb-runner-node/module/savereturn/controller/page/common')

const {
  client,
  sendEmail,
  getConfig
} = require('~/fb-runner-node/module/savereturn/controller/savereturn')

module.exports = class StartController extends CommonController {
  async postValidation (pageInstance, userData) {
    pageInstance = cloneDeep(pageInstance)

    const email = userData.getUserDataProperty('email')
    const duration = getConfig('emailTokenDuration')

    try {
      const token = await client.createMagiclink(email, duration, userData.logger)
      await sendEmail('email.return.signin.email', userData, { token })
    } catch (e) {
      if (e.code !== 401 || e.message !== 'email.missing') {
        throw e
      }
    }

    return pageInstance
  }
}
