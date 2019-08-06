const path = require('path')
const {
  existsSync,
  writeFileSync
} = require('fs')

const ensureGitIgnoreExists = (servicePath) => {
  // Ensure that a sensible .gitignore file exists
  const serviceGitIgnorePath = path.join(servicePath, '.gitignore')
  if (!existsSync(serviceGitIgnorePath)) {
    const defaultGitIgnore = `
node_modules
.DS_Store
package.json
package-lock.json
`
    writeFileSync(serviceGitIgnorePath, defaultGitIgnore)
  }
}

module.exports = ensureGitIgnoreExists
