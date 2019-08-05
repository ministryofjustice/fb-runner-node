const {existsSync} = require('fs')
const {execSync} = require('child_process')

const cleanupGeneratedFiles = async (servicePackagePath, servicePackageLockPath) => {
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
        process.exit(2)
      })

      // catch uncaught exceptions, trace, then exit normally
      process.on('uncaughtException', function (e) {
        // eslint-disable-next-line no-console
        console.log(e.stack)
        process.exit(99)
      })
    }

    Cleanup(cleanupPackage)
  }
}

module.exports = cleanupGeneratedFiles
