const {get, set, unset} = require('../../control-path/control-path')

const inMemory = (req) => {
  req.session.input = req.session.input || {}
  const userData = req.session.input

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
const userData = (req, res, next) => {
  req.user = inMemory(req)
  next()
}

module.exports = userData
