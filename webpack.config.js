/*
 *  Resolves module aliases in IDEs (WebStorm, etc)
 *
 *  For runtime module alias resolution see
 *  https://www.npmjs.com/package/module-alias
 */
const {
  _moduleAliases
} = require('./package.json')

module.exports = {
  mode: 'production',
  resolve: {
    alias: {
      ..._moduleAliases
    }
  }
}
