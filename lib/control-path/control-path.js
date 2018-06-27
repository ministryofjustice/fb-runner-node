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

const removePath = (data, path) => {
  path = fixPath(path)
  let prop
  let propType = 'array'
  const parentPath = path.replace(/\[([^[]+)\]$/, (m, m1) => {
    prop = m1
    if (prop.includes('"')) {
      propType = 'object'
      prop = prop.replace(/"/g, '')
    }
    return ''
  })
  const pathObj = get(data, parentPath)
  if (propType === 'object') {
    delete pathObj[prop]
  } else {
    pathObj.splice(prop, 1)
  }
}

module.exports = {
  get: getPath,
  set: setPath,
  unset: unsetPath
}
