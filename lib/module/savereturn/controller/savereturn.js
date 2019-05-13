const client = require('./client/save-return')
const {default: produce} = require('immer')

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
  const authenticated = userData.getUserDataProperty('authenticated', undefined, 'savereturn')
  const {email: userEmail} = userData.getUserData('savereturn')

  if (!authenticated) {
    return pageInstance
  }

  return produce(pageInstance, draft => {
    draft.headerNavigation = draft.headerNavigation || []

    draft.headerNavigation.push({
      text: `Signed in as ${userEmail}`,
      href: '/',
      active: true,
      attributes: {
        id: 'signedin'
      }
    })

    draft.headerNavigation.push({
      text: 'Sign out',
      href: '/sign-out'
    })

    return draft
  })
}

module.exports = {
  client,
  resetUser,
  authenticate,
  deauthenticate,
  preRender
}
