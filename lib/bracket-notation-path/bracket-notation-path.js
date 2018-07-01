const get = require('lodash.get')
const set = require('lodash.set')
const unset = require('lodash.unset')

// Bracket Notation
const fixBracketNotationPath = (path) => {
  return path.replace(/\[([^\d"'][^\]]*)\]/g, '["$1"]')
}

const getBracketNotationPath = (data, path, def) => get(data, fixBracketNotationPath(path), def)

const setBracketNotationPath = (data, path, value) => {
  const fixedPath = fixBracketNotationPath(path)
  set(data, fixedPath, value)
  return get(data, fixedPath)
}

const unsetBracketNotationPath = (data, path) => unset(data, fixBracketNotationPath(path))

module.exports = {
  getBracketNotationPath,
  setBracketNotationPath,
  unsetBracketNotationPath
}
