const path = require('path')

module.exports = function getSchemas (specsPath = process.cwd()) {
  const schemas = []

  try {
    const {
      specifications
    } = require(path.join(specsPath, 'package.json'))
    specifications.path = specsPath
    schemas.push(specifications)
  } catch (e) {
    // no package.json
  }

  return schemas
}
