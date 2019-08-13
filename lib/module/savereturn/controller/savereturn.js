const emailClient = require('../../../client/email/email')
const smsClient = require('../../../client/sms/sms')

const client = require('./client/save-return')
const {getInstance, getInstanceProperty} = require('../../../service-data/service-data')
const {format} = require('../../../format/format')

const handleValidationError = (e, type) => {
  if (e.code === 401 && e.message) {
    const errorInstance = getInstance(`${type}.${e.message}`)
    if (errorInstance) {
      return errorInstance
    }
  }
  throw e
}

const resetUser = async (userData, details) => {
  const {userId, userToken, email, mobile} = details
  await userData.resetUserData(userId, userToken)
  userData.setUserDataProperty('email', email)
  if (mobile) {
    userData.setUserDataProperty('mobile', mobile)
  }
}

const authenticate = async (userData, action) => {
  userData.setUserDataProperty('authenticated', true)
  const loginTime = Date.now()
  userData.setUserDataProperty('loginTime', loginTime)
  setHistory(userData, action)
}

const deauthenticate = (userData) => {
  userData.unsetUserDataProperty('authenticated')
  setHistory(userData, 'deauthenticate')
}

const setHistory = (userData, action) => {
  const history = userData.getUserDataProperty('history') || []
  history.push({
    phase: action,
    date: Date.now()
  })
  userData.setUserDataProperty('history', history)
}

const getConfig = (prop, defaultValue) => getInstanceProperty('module.savereturn.config', prop, defaultValue)

const getMessage = (_id, userData, personalisation = {}, args = {}) => {
  const message = getInstance(_id)

  const data = Object.assign({}, userData.getScopedUserData(), args)
  Object.keys(message).forEach(prop => {
    if (prop === 'template_name' || prop.startsWith('_') || prop.startsWith('$')) {
      return
    }
    if (typeof message[prop] === 'string') {
      message[prop] = format(message[prop], data, {markdown: false})
    }
  })
  message.extra_personalisation = personalisation

  return message
}

const external = {
  client,
  handleValidationError,
  resetUser,
  authenticate,
  deauthenticate,
  getConfig,
  getMessage
}

external.getEmailMessage = getMessage
external.getSMSMessage = getMessage

const sendEmail = async (_id, userData, personalisation = {}, args = {}) => {
  const message = external.getEmailMessage(_id, userData, personalisation, args)
  return emailClient.sendMessage(message, {logger: userData.logger})
}

const sendSMS = async (_id, userData, personalisation = {}, args = {}) => {
  const message = external.getSMSMessage(_id, userData, personalisation, args)
  return smsClient.sendMessage(message, {logger: userData.logger})
}

external.sendEmail = sendEmail
external.sendSMS = sendSMS

module.exports = external
