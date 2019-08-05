const {
  existsSync,
  removeSync
} = require('fs-extra')
const isOnline = require('is-online')

const {FBError} = require('@ministryofjustice/fb-utils-node')
class FBServerError extends FBError {}

const preinstallSourcesOnlineCheck = async (servicePackagePath, serviceNodeModulesPath, PLATFORM_ENV) => {
  if (!PLATFORM_ENV) {
    const servicePackageExists = existsSync(servicePackagePath)
    let online
    try {
      online = await isOnline()
    } catch (e) {
    //
    }
    const hasServiceNoduleModules = existsSync(serviceNodeModulesPath)
    // delete previously installed service node_modules unless defined in an existing package.json
    if (hasServiceNoduleModules && online && !servicePackageExists) {
      removeSync(serviceNodeModulesPath)
    } else if (!hasServiceNoduleModules && !online) {
      // no service node_modules and no internet connection is a brick wall
      // TODO: stash fb-components-core locally and copy that if defaulting to latest
      throw new FBServerError({
        code: 'ENOINSTALLDEPENDENCIES',
        message: 'Service does not have its dependencies installed and there is no internet connection'
      })
    }
  }
}

module.exports = preinstallSourcesOnlineCheck
