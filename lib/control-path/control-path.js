const get = require('lodash.get')
const set = require('lodash.set')
const unset = require('lodash.unset')

// Bracket Notation
const fixPath = (path) => {
  return path.replace(/\[([^\d"'][^\]]*)\]/g, '["$1"]')
}

const getUserDataProperty = (data, path, def) => get(data, fixPath(path), def)

const setUserDataProperty = (data, path, value) => {
  const fixedPath = fixPath(path)
  set(data, fixedPath, value)
  return get(data, fixedPath)
}

const unsetUserDataProperty = (data, path) => unset(data, fixPath(path))

module.exports = {
  get: getUserDataProperty,
  set: setUserDataProperty,
  unset: unsetUserDataProperty
}
