const path = require('path')
const {
  existsSync,
  writeFileSync
} = require('fs')
const {execSync} = require('child_process')
const isOnline = require('is-online')
const loadJson = require('load-json-file').sync

const {FBError} = require('@ministryofjustice/fb-utils-node')
class FBServerError extends FBError {}

const installSources = async (options = {}) => {
  const {
    PLATFORM_ENV,
    COMPONENTS_MODULE,
    COMPONENTS_VERSION,
    SERVICE_PATH,
    servicePackagePath,
    serviceConfigPath,
    servicePackageLockPath,
    serviceNodeModulesPath,
    resolvedServicePath
  } = options

  // Ensure that a sensible .gitignore file exists
  const serviceGitIgnorePath = path.join(resolvedServicePath, '.gitignore')
  if (!existsSync(serviceGitIgnorePath)) {
    const defaultGitIgnore = `
node_modules
.DS_Store
package.json
package-lock.json
`
    writeFileSync(serviceGitIgnorePath, defaultGitIgnore)
  }

  const servicePackageExists = existsSync(servicePackagePath)
  if (!servicePackageExists) {
    // ensure that any auto-generated package files are deleted whatever happens
    const cleanupPackage = () => {
      try {
        execSync(`rm -f ${servicePackagePath} ${servicePackageLockPath}`)
      } catch (e) {
        //
      }
    }

    const Cleanup = (callback) => {
      const noop = () => {}
      // attach user callback to the process event emitter
      // if no callback, it will still exit gracefully on Ctrl-C
      callback = callback || noop
      process.on('cleanup', callback)

      // do app specific cleaning before exiting
      process.on('exit', function () {
        process.emit('cleanup')
      })

      // catch ctrl+c event and exit normally
      process.on('SIGINT', function () {
        console.log('Ctrl-C...')
        process.exit(2)
      })

      // catch uncaught exceptions, trace, then exit normally
      process.on('uncaughtException', function (e) {
        console.log('Uncaught Exception...')
        console.log(e.stack)
        process.exit(99)
      })
    }

    Cleanup(cleanupPackage)

    // Create package.json with default components dependencies
    const defaultPackage = `
{
  "dependencies": {
    "${COMPONENTS_MODULE}": "${COMPONENTS_VERSION}"
  }
}
`
    writeFileSync(servicePackagePath, defaultPackage)

    // update service config if needed
    // NB. this can be removed once https://github.com/ministryofjustice/fb-service-starter/pull/2 has been merged
    const serviceConfigFilePath = path.join(serviceConfigPath, 'service.json')
    const serviceConfig = loadJson(serviceConfigFilePath)
    if (!serviceConfig._isa) {
      serviceConfig._isa = `${COMPONENTS_MODULE}=>service`
      writeFileSync(serviceConfigFilePath, JSON.stringify(serviceConfig, null, 2))
    }
  }

  if (!PLATFORM_ENV) {
    let online
    try {
      online = await isOnline()
    } catch (e) {
    //
    }
    const hasServiceNoduleModules = existsSync(serviceNodeModulesPath)
    // do not delete previously installed service node_modules if defined in an existing package.json
    if (hasServiceNoduleModules && online && !servicePackageExists) {
      execSync(`rm -rf ${serviceNodeModulesPath}`)
    } else if (!hasServiceNoduleModules && !online) {
      // no service node_modules and no internet connection is a brick wall
      // TODO: stash fb-components-core locally and copy that if defaulting to latest
      throw new FBServerError({
        code: 'ENOINSTALLDEPENDENCIES',
        message: `${SERVICE_PATH} does not have its dependencies installed and there is no internet connection`
      })
    }
  }

  execSync(`cd ${resolvedServicePath} && npm install`)
}

module.exports = installSources
