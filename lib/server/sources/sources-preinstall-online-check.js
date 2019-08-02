const {
  existsSync
} = require('fs')
const {execSync} = require('child_process')
const isOnline = require('is-online')

const {FBError} = require('@ministryofjustice/fb-utils-node')
class FBServerError extends FBError {}

const preinstallSourcesOnlineCheck = async (options = {}) => {
  const {
    PLATFORM_ENV,
    servicePackageExists,
    serviceNodeModulesPath
  } = options

  if (!PLATFORM_ENV) {
    let online
    try {
      online = await isOnline()
    } catch (e) {
    //
    }
    const hasServiceNoduleModules = existsSync(serviceNodeModulesPath)
    console.log({hasServiceNoduleModules, serviceNodeModulesPath})
    // delete previously installed service node_modules unless defined in an existing package.json
    if (hasServiceNoduleModules && online && !servicePackageExists) {
      execSync(`rm -rf ${serviceNodeModulesPath}`)
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
