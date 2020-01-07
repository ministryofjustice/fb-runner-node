const path = require('path')

const {FBLogger} = require('@ministryofjustice/fb-utils-node')

module.exports = function getSchemas (specsPath = process.cwd()) {
  const schemas = []

  try {
    const {
      specifications
    } = require(path.join(specsPath, 'package.json'))
    specifications.path = specsPath
    schemas.push(specifications)
  } catch (e) {
    FBLogger('`package.json` not found error')
  }

  return schemas
}
