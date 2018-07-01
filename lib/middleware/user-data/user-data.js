const {get, set, unset} = require('../../control-path/control-path')

const getData = (session) => {
  // DynamoDB code to go here
  const userData = session.input
  return userData
}

const getUserDataMethods = (session) => {
  const userData = getData(session)

  return {
    getUserDataProperty: (path, def) => get(userData, path, def),
    getUserData: () => userData,
    setUserDataProperty: (path, value) => set(userData, path, value),
    setUserData: (data) => Object.assign(userData, data),
    unsetUserDataProperty: (path) => unset(userData, path)
  }
}

const load = (req, res, next) => {
  req.session.input = req.session.input || {}
  req.user = getUserDataMethods(req.session)
  next()
}

const save = (req, res, next) => {
  // DynamoDB code to go here
  next()
}

module.exports = {
  load,
  save,
  getUserDataMethods
}
