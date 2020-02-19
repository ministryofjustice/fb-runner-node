require('@ministryofjustice/module-alias/register-module')(module)

const emailClient = require('~/fb-runner-node/client/email/email')
const smsClient = require('~/fb-runner-node/client/sms/sms')
const savereturnClient = require('~/fb-runner-node/module/savereturn/client/savereturn/savereturn')

const {
  getInstance,
  getInstanceProperty
} = require('~/fb-runner-node/service-data/service-data')

const {
  format
} = require('~/fb-runner-node/format/format')

function handleValidationError (e, type) {
  if (e.code === 401 && e.message) {
    const errorInstance = getInstance(`${type}.${e.message}`)
    if (errorInstance) {
      return errorInstance
    }
  }
  throw e
}

async function resetUser (userData, details) {
  const { userId, userToken, email, mobile } = details
  await userData.resetUserData(userId, userToken)
  userData.setUserDataProperty('email', email)
  if (mobile) {
    userData.setUserDataProperty('mobile', mobile)
  }
}

async function authenticate (userData, action) {
  userData.setUserDataProperty('authenticated', true)
  const loginTime = Date.now()
  userData.setUserDataProperty('loginTime', loginTime)
  setHistory(userData, action)
}

function deauthenticate (userData) {
  userData.unsetUserDataProperty('authenticated')
  setHistory(userData, 'deauthenticate')
}

function setHistory (userData, action) {
  const history = userData.getUserDataProperty('history') || []
  history.push({
    phase: action,
    date: Date.now()
  })
  userData.setUserDataProperty('history', history)
}

const getConfig = (prop, defaultValue) => getInstanceProperty('module.savereturn.config', prop, defaultValue)

function getMessage (_id, userData, dataArgs = {}, personalisation = {}) {
  const message = getInstance(_id)

  const data = Object.assign({}, userData.getScopedUserData(), dataArgs)

  Object.keys(message).forEach(prop => {
    if (prop === 'template_name' || prop.startsWith('_') || prop.startsWith('$')) {
      return
    }
    if (typeof message[prop] === 'string') {
      message[prop] = format(message[prop], data, { markdown: false })
    }
  })
  message.extra_personalisation = personalisation

  return message
}

const external = {
  client: savereturnClient,
  handleValidationError,
  resetUser,
  authenticate,
  deauthenticate,
  getConfig,
  getMessage
}

external.getEmailMessage = getMessage
external.getSMSMessage = getMessage

async function sendEmail (_id, userData, dataArgs = {}, personalisation = {}) {
  const message = external.getEmailMessage(_id, userData, dataArgs, personalisation)
  return emailClient.sendMessage(message, {}, userData.logger)
}

async function sendSMS (_id, userData, dataArgs = {}, personalisation = {}) {
  const message = external.getSMSMessage(_id, userData, dataArgs, personalisation)
  return smsClient.sendMessage(message, {}, userData.logger)
}

external.sendEmail = sendEmail
external.sendSMS = sendSMS

module.exports = external
