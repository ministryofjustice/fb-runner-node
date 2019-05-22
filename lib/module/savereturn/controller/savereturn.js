// const {produce} = require('immer')
const emailClient = require('../../../client/email/email')

const client = require('./client/save-return')
// const {setFormContent, formatProperties} = require('../../../page/page')
const {getInstance} = require('../../../service-data/service-data')
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

const getMessage = (_id, userData, args = {}) => {
  const message = getInstance(_id)

  const data = Object.assign({}, userData.getScopedUserData(), args)
  Object.keys(message).forEach(prop => {
    if (prop.startsWith('_') || prop.startsWith('$')) {
      return
    }
    message[prop] = format(message[prop], data, {markdown: false})
  })

  return message
}

const getEmailMessage = getMessage
const getSmsMessage = getMessage

const sendEmail = (_id, userData, args = {}) => {
  const message = getEmailMessage(_id, userData, args)
  emailClient.send(message)
}

const deauthenticate = (userData) => {
  userData.unsetUserDataProperty('authenticated')
  setHistory(userData, 'deauthenticate')
}

// const preRender = (pageInstance, userData) => {
//   const authenticated = userData.getUserDataProperty('authenticated', undefined, 'savereturn')
//   if (authenticated) {
//     pageInstance = produce(pageInstance, draft => {
//       if (userData.getScope() === 'input') {
//         const actionType = getInstanceProperty(draft._id, 'actionType', 'continue')

//         if (actionType === 'continue') {
//           draft.actionType = 'saveContinue'
//         }
//       }
//       return draft
//     })
//     pageInstance = setFormContent(pageInstance, userData)
//     // pageInstance = formatProperties(pageInstance, userData)
//   }
//   return pageInstance
// }

module.exports = {
  client,
  resetUser,
  authenticate,
  deauthenticate,
  // preRender,
  getEmailMessage,
  getSmsMessage,
  sendEmail
}
