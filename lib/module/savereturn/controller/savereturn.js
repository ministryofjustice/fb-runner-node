const client = require('./client/save-return')
const {setFormContent} = require('../../../page/page')
const {produce} = require('immer')
const {getInstanceProperty} = require('../../../service-data/service-data')

const resetUser = async (userData, details) => {
  const {userId, userToken} = details
  await userData.resetUserData(userId, userToken)
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

const deauthenticate = (userData) => {
  userData.unsetUserDataProperty('authenticated')
  setHistory(userData, 'deauthenticate')
}

const preRender = (pageInstance, userData) => {
  if (userData.getScope() === 'input') {
    const actionType = getInstanceProperty(pageInstance._id, 'actionType', 'continue')
    if (actionType === 'continue') {
      if (userData.getUserDataProperty('authenticated', undefined, 'savereturn')) {
        pageInstance = produce(pageInstance, (draft) => {
          draft.actionType = 'saveContinue'
          return draft
        })
      }
    }
  }

  pageInstance = setFormContent(pageInstance, userData)
  return pageInstance
}

module.exports = {
  client,
  resetUser,
  authenticate,
  deauthenticate,
  preRender
}
