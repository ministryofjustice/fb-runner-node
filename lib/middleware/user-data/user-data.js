const {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
} = require('../../bracket-notation-path/bracket-notation-path')

const getData = (session) => {
  // DynamoDB code to go here
  const userData = session.input
  return userData
}

const getUserDataMethods = (session) => {
  const userData = getData(session)

  return {
    getAllData: () => {
      return {
        input: userData
      }
    },
    getUserDataProperty: (path, def) => getBracketNotationPath(userData, path, def),
    getUserData: () => userData,
    setUserDataProperty: (path, value) => setBracketNotationPath(userData, path, value),
    setUserData: (data) => Object.assign(userData, data),
    unsetUserDataProperty: (path) => unsetBracketNotationPath(userData, path)
  }
}

const loadUserData = (req, res, next) => {
  req.session.input = req.session.input || {}
  Object.defineProperty(req, 'user', {
    writeable: false,
    value: getUserDataMethods(req.session)
  })
  Object.freeze(req.user)
  next()
}

const saveUserData = (req, res, next) => {
  // DynamoDB code to go here
  next()
}

module.exports = {
  loadUserData,
  saveUserData,
  getUserDataMethods
}
