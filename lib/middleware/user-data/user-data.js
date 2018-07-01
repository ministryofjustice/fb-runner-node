const {get, set, unset} = require('../../control-path/control-path')

const getData = (session) => {
  // DynamoDB code to go here
  const userData = session.input
  return userData
}

const getUserDataMethods = (session) => {
  const userData = getData(session)

  return {
    getPath: (path, def) => get(userData, path, def),
    getAll: () => userData,
    setPath: (path, value) => set(userData, path, value),
    setAll: (data) => {
      Object.assign(userData, data)
      return userData
    },
    unsetPath: (path) => unset(userData, path)
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
