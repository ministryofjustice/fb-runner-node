const path = require('path')
/**
 *  Resolves module aliases in IDEs (WebStorm, etc)
 *
 *  For runtime module alias resolution see `_moduleAliases { }`
 *  in `package.json`
 */
module.exports = {
  mode: 'production',
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './lib')
    }
  }
}
