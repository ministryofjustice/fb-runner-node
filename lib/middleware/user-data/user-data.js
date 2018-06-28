const {get, set, unset} = require('../../control-path/control-path')

const getData = (req) => {
  // DynamoDB code to go here
  req.session.input = req.session.input || {}
  const userData = req.session.input
  return userData
}

const getUserMethods = (req) => {
  const userData = getData(req)

  return {
    getPath: (path, def) => get(userData, path, def),
    getAll: () => userData,
    setPath: (path, value) => {
      set(userData, path, value)
      return get(userData, path)
    },
    setAll: (data) => {
      Object.assign(userData, data)
      return userData
    },
    unsetPath: (path) => unset(userData, path)
  }
}

const load = (req, res, next) => {
  req.user = getUserMethods(req)
  next()
}

const save = (req, res, next) => {
  // DynamoDB code to go here
  next()
}

module.exports = {
  load,
  save
}
