const client = require('../../../client/save-return')

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
}

module.exports = {
  client,
  resetUser,
  authenticate,
  deauthenticate
}
