// const {produce} = require('immer')
const emailClient = require('../../../client/email/email')
const smsClient = require('../../../client/sms/sms')

const client = require('./client/save-return')
// const {setFormContent, formatProperties} = require('../../../page/page')
const {getInstance, getInstanceProperty} = require('../../../service-data/service-data')
const {format} = require('../../../format/format')

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
  setHistory(userData, action)
}

const setHistory = (userData, action) => {
  const history = userData.setUserDataProperty('history') || []
  history.push({
    phase: action,
    date: Date.now()
  })
}

const getMessage = (_id, userData, personalisation = {}, args = {}) => {
  const message = getInstance(_id)

  const data = Object.assign({}, userData.getScopedUserData(), args)
  Object.keys(message).forEach(prop => {
    if (prop.startsWith('_') || prop.startsWith('$')) {
      return
    }
    if (message[prop]) {
      message[prop] = format(message[prop], data, {markdown: false})
    }
  })
  message.extra_personalisation = personalisation

  return message
}

const getEmailMessage = getMessage
const getSmsMessage = getMessage

const sendEmail = async (_id, userData, personalisation = {}, args = {}) => {
  const message = getEmailMessage(_id, userData, personalisation, args)
  return emailClient.send(message)
}

const sendSMS = async (_id, userData, personalisation = {}, args = {}) => {
  const message = getSmsMessage(_id, userData, personalisation, args)
  return smsClient.send(message)
}

const deauthenticate = (userData) => {
  userData.unsetUserDataProperty('authenticated')
  setHistory(userData, 'deauthenticate')
}

const getConfig = (prop, defaultValue) => getInstanceProperty('module.savereturn.config', prop, defaultValue)

module.exports = {
  client,
  resetUser,
  authenticate,
  deauthenticate,
  getEmailMessage,
  getSmsMessage,
  sendEmail,
  sendSMS,
  getConfig
}
