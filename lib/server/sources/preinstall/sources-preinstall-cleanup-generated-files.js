const {
  existsSync,
  unlinkSync
} = require('fs')
const nodeCleanup = require('node-cleanup')

const cleanupGeneratedFiles = (servicePackagePath, servicePackageLockPath) => {
  cleanupGeneratedFiles.cleanup = undefined
  const servicePackageExists = existsSync(servicePackagePath)
  if (!servicePackageExists) {
    // ensure that any auto-generated package files are deleted whatever happens
    const generatedFiles = [servicePackagePath, servicePackageLockPath]
    const cleanupPackageFiles = () => {
      generatedFiles.forEach(file => {
        try {
          if (file) {
            unlinkSync(file)
          }
        } catch (e) {
          //
        }
      })
    }

    cleanupGeneratedFiles.cleanup = cleanupPackageFiles

    nodeCleanup(cleanupPackageFiles)
  }
}

module.exports = cleanupGeneratedFiles
