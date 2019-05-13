const {produce} = require('immer')

const client = require('./client/save-return')
const {setFormContent} = require('../../../page/page')
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
  const authenticated = userData.getUserDataProperty('authenticated', undefined, 'savereturn')

  let updatedPageInstance = produce(pageInstance, draft => {
    if (authenticated) {
      const {email: userEmail} = userData.getUserData('savereturn')
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
    }

    if (userData.getScope() === 'input') {
      const actionType = getInstanceProperty(draft._id, 'actionType', 'continue')

      if (actionType === 'continue') {
        if (userData.getUserDataProperty('authenticated', undefined, 'savereturn')) {
          draft.actionType = 'saveContinue'
        }
      }
    }

    return draft
  })

  updatedPageInstance = setFormContent(updatedPageInstance, userData)
  return updatedPageInstance
}

module.exports = {
  client,
  resetUser,
  authenticate,
  deauthenticate,
  preRender
}
