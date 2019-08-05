const {
  existsSync,
  writeFileSync
} = require('fs')

const ensurePackage = (servicePackagePath, COMPONENTS_MODULE, COMPONENTS_VERSION) => {
  const servicePackageExists = existsSync(servicePackagePath)
  if (!servicePackageExists) {
    // Create package.json with default components dependencies
    const defaultPackageJson = {
      dependencies: {
        [COMPONENTS_MODULE]: COMPONENTS_VERSION
      }
    }
    const defaultPackage = JSON.stringify(defaultPackageJson, null, 2)

    writeFileSync(servicePackagePath, defaultPackage)
  }
}

module.exports = ensurePackage
