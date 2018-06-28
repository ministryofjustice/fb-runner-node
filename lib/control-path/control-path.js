const get = require('lodash.get')
const set = require('lodash.set')
const unset = require('lodash.unset')

const fixPath = (path) => {
  return path.replace(/\[([^\d"'][^\]]*)\]/g, '["$1"]')
}

const getPath = (data, path, def) => get(data, fixPath(path), def)

const setPath = (data, path, value) => {
  const fixedPath = fixPath(path)
  set(data, fixedPath, value)
  return get(data, fixedPath)
}

const unsetPath = (data, path) => unset(data, fixPath(path))

module.exports = {
  get: getPath,
  set: setPath,
  unset: unsetPath
}
