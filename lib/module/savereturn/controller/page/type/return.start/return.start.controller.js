require('@ministryofjustice/module-alias/register-module')(module)

const cloneDeep = require('lodash.clonedeep')

const CommonController = require('~/fb-runner-node/module/savereturn/controller/page/common')
const {
  setErrors
} = require('~/fb-runner-node/page/set-errors/set-errors')

const {
  client,
  handleValidationError,
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
    } catch (error) {
      const { code } = error

      if (code !== 'ENOENCRYPTVALUE') {
        const errorsInstance = handleValidationError(error, 'error')
        pageInstance = registerReturnStartErrors(errorsInstance, pageInstance, error)
        return pageInstance
      }
    }

    return pageInstance
  }
}

function registerReturnStartErrors (errorsInstance, pageInstance, error) {
  const component = pageInstance.components[0] // single component on the page currently
  errorsInstance.instance = {
    _id: component._id,
    _type: component._type,
    name: component.name
  }
  errorsInstance.errorType = error.message

  pageInstance = setErrors(pageInstance, [errorsInstance])
  // This stops the page from redirecting to the next step
  pageInstance.$validated = false
  return pageInstance
}
