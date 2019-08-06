const {execSync} = require('child_process')

const installSources = (resolvedServicePath) => {
  execSync(`cd ${resolvedServicePath} && npm install`)
}

module.exports = installSources
