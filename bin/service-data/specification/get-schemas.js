const path = require('path')

const debug = require('debug')
const log = debug('runner:get-schema:log')
const error = debug('runner:get-schema:error')

module.exports = function getSchemas (specsPath = process.cwd()) {
  const schemas = []

  try {
    log(`Getting Schemas from "${specsPath}" ...`)

    const {
      specifications
    } = require(path.join(specsPath, 'package.json'))
    specifications.path = specsPath
    schemas.push(specifications)

    log('... Done')
  } catch (e) {
    error('`package.json` not found error')
  }

  return schemas
}
