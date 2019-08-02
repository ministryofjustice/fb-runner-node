const path = require('path')
const {
  existsSync,
  writeFileSync
} = require('fs')
const {execSync} = require('child_process')
const loadJson = require('load-json-file').sync

const preinstallSourcesOnlineCheck = require('./sources-preinstall-online-check')

const preinstallSources = async (options = {}) => {
  const {
    PLATFORM_ENV,
    COMPONENTS_MODULE,
    COMPONENTS_VERSION,
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
        if (servicePackagePath && servicePackageLockPath) {
          execSync(`rm -f ${servicePackagePath} ${servicePackageLockPath}`)
        }
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

  await preinstallSourcesOnlineCheck({
    PLATFORM_ENV,
    servicePackageExists,
    serviceNodeModulesPath
  })
}

module.exports = preinstallSources
