const performOnlineCheck = require('./sources-preinstall-online-check')
const ensureGitIgnoreExists = require('./sources-preinstall-ensure-gitignore')
const cleanupGeneratedFiles = require('./sources-preinstall-cleanup-generated-files')
const updateServiceConfig = require('./sources-preinstall-update-service-config')
const ensurePackage = require('./sources-preinstall-ensure-package')

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

  await performOnlineCheck(servicePackagePath, serviceNodeModulesPath, PLATFORM_ENV)

  // Ensure that a sensible .gitignore file exists
  ensureGitIgnoreExists(resolvedServicePath)

  // Ensure auto-generated files are cleaned up
  cleanupGeneratedFiles(servicePackagePath, servicePackageLockPath)

  // By default, services will not have pinned the version of components required
  ensurePackage(servicePackagePath, COMPONENTS_VERSION, COMPONENTS_MODULE)

  // Update service config if needed
  updateServiceConfig(serviceConfigPath, COMPONENTS_MODULE)
}

module.exports = preinstallSources
